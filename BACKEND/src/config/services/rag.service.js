import { Pinecone } from "@pinecone-database/pinecone";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// ─── Lazy singletons ────────────────────────────────────────────────────────

let _pinecone = null;
let _embeddings = null;

function getPinecone() {
  if (!_pinecone) {
    _pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return _pinecone;
}

function getEmbeddings() {
  if (!_embeddings) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Please set MISTRAL_API_KEY in your .env file."
      );
    }
    _embeddings = new MistralAIEmbeddings({
      model: "mistral-embed", // 1024-dimensional embeddings
      apiKey,
    });
  }
  return _embeddings;
}

async function getIndex() {
  const pc = getPinecone();
  const indexName = process.env.PINECONE_INDEX_NAME || "perplexityrag";

  // Check if index exists, create if not
  const existingIndexes = await pc.listIndexes();
  const exists = existingIndexes.indexes?.some((i) => i.name === indexName);

  if (!exists) {
    console.log(`[RAG] Creating Pinecone index: ${indexName}`);
    await pc.createIndex({
      name: indexName,
      dimension: 1024, // mistral-embed produces 1024-dim vectors
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });
    // Wait for index to be ready
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  return pc.index(indexName);
}

// ─── Text extraction ─────────────────────────────────────────────────────────

async function extractText(fileBuffer, mimeType) {
  if (mimeType === "application/pdf") {
    const data = await pdfParse(fileBuffer);
    return data.text;
  }
  // Plain text / markdown
  return fileBuffer.toString("utf-8");
}

// ─── Core RAG functions ───────────────────────────────────────────────────────

/**
 * Process & index a document into Pinecone.
 * @param {string} spaceId - MongoDB Space _id (used as Pinecone namespace)
 * @param {string} docId   - Unique doc identifier (stored in Pinecone metadata)
 * @param {string} filename - Display filename
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @returns {number} number of chunks indexed
 */
export async function processDocument(spaceId, docId, filename, fileBuffer, mimeType) {
  console.log(`[RAG] Processing document: ${filename} for space: ${spaceId}`);

  // 1. Extract raw text
  const rawText = await extractText(fileBuffer, mimeType);
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("Could not extract text from the document.");
  }

  // 2. Split into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 80,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });
  const chunks = await splitter.splitText(rawText);
  console.log(`[RAG] Split into ${chunks.length} chunks`);

  // 3. Embed all chunks
  const embeddings = getEmbeddings();
  const vectors = await embeddings.embedDocuments(chunks);

  // 4. Upsert into Pinecone (namespace = spaceId)
  const index = await getIndex();
  const ns = index.namespace(spaceId);

  const pineconeRecords = chunks.map((chunk, i) => ({
    id: `${docId}-chunk-${i}`,
    values: vectors[i],
    metadata: {
      spaceId,
      docId,
      filename,
      chunkIndex: i,
      text: chunk.substring(0, 1000), // Pinecone metadata limit
    },
  }));

  // Upsert in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < pineconeRecords.length; i += BATCH_SIZE) {
    await ns.upsert(pineconeRecords.slice(i, i + BATCH_SIZE));
  }

  console.log(`[RAG] Indexed ${chunks.length} chunks into Pinecone`);
  return chunks.length;
}

/**
 * Delete all vectors belonging to a document from Pinecone.
 * @param {string} spaceId
 * @param {string} docId
 */
export async function deleteDocumentVectors(spaceId, docId) {
  try {
    const index = await getIndex();
    const ns = index.namespace(spaceId);

    // Query to find all vectors for this doc, then delete by prefix
    // Pinecone serverless supports deleteMany by filter
    await ns.deleteMany({ docId });
    console.log(`[RAG] Deleted vectors for doc: ${docId} in space: ${spaceId}`);
  } catch (err) {
    console.error("[RAG] Error deleting document vectors:", err.message);
  }
}

/**
 * Delete all vectors for a space (when space is deleted).
 * @param {string} spaceId
 */
export async function deleteSpaceVectors(spaceId) {
  try {
    const index = await getIndex();
    const ns = index.namespace(spaceId);
    await ns.deleteAll();
    console.log(`[RAG] Deleted all vectors for space: ${spaceId}`);
  } catch (err) {
    console.error("[RAG] Error deleting space vectors:", err.message);
  }
}

/**
 * Retrieve top-K relevant chunks for a query.
 * @param {string} spaceId
 * @param {string} query
 * @param {number} topK
 * @returns {Array<{ text: string, filename: string, score: number }>}
 */
export async function retrieveContext(spaceId, query, topK = 5) {
  console.log(`[RAG] Retrieving context for query in space: ${spaceId}`);

  const embeddings = getEmbeddings();
  const queryVector = await embeddings.embedQuery(query);

  const index = await getIndex();
  const ns = index.namespace(spaceId);

  const result = await ns.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  const matches = result.matches || [];
  console.log(`[RAG] Found ${matches.length} relevant chunks`);

  return matches.map((m) => ({
    text: m.metadata?.text || "",
    filename: m.metadata?.filename || "unknown",
    score: m.score || 0,
  }));
}

/**
 * Build a RAG-augmented prompt from retrieved chunks.
 * @param {string} query
 * @param {Array} contextChunks
 * @returns {string} system prompt with context injected
 */
export function buildRagSystemPrompt(query, contextChunks) {
  if (!contextChunks || contextChunks.length === 0) {
    return "You are Perplexity, a helpful AI assistant. Answer concisely using markdown.";
  }

  const contextText = contextChunks
    .map((c, i) => `[Source ${i + 1} — ${c.filename}]\n${c.text}`)
    .join("\n\n---\n\n");

  return `You are Perplexity, a helpful AI research assistant. You have been provided with relevant excerpts from the user's uploaded documents.

Use the context below to answer the user's question. If the answer is in the context, cite the source filename. If the context doesn't cover the question, answer from your general knowledge and say so.

=== DOCUMENT CONTEXT ===
${contextText}
========================

Answer in clear, well-formatted markdown. Be precise and helpful.`;
}

#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.cwd(), 'data/canonical');
const states = new Set(['staged', 'reviewed', 'canonical']);
const provenanceClasses = new Set(['Screenshot Verified', 'Official Current', 'Derived', 'Community/Observed']);
const requiredByType = {
  characters: ['id', 'display_name', 'record_state'],
  champion_variants: ['id', 'character_id', 'display_name', 'resolution_state', 'record_state'],
  evidence_sources: ['id', 'source_type', 'original_filename', 'sha256', 'review_status'],
  claims: ['id', 'claim_class', 'provenance', 'subject', 'predicate', 'record_state'],
  claim_evidence: ['id', 'claim_id', 'evidence_source_id', 'direction', 'record_state'],
  relationships: ['id', 'kind', 'subject', 'object', 'why', 'record_state'],
  conflicts: ['id', 'status', 'summary', 'record_state']
};
const errors = [];
const warnings = [];
const collections = [];
let exampleManifestCount = 0;
const addError = (where, message) => errors.push(`${where}: ${message}`);
const addWarning = (where, message) => warnings.push(`${where}: ${message}`);

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    addError(path.relative(root, file), `malformed JSON (${error.message})`);
    return null;
  }
}

function validHash(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function validateManifest(file, manifest) {
  const where = path.relative(root, file);
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    addError(where, 'manifest must be an object');
    return;
  }
  exampleManifestCount += 1;
  if (manifest.synthetic_example !== true || manifest.loadable !== false) {
    addError(where, 'example manifests must be explicitly synthetic and non-loadable');
  }
  if (!Array.isArray(manifest.entries)) addError(where, 'manifest entries must be an array');
  for (const [index, entry] of (manifest.entries || []).entries()) {
    const item = `${where}#${index}`;
    for (const key of ['id', 'source_type', 'original_filename', 'archive_locator', 'sha256', 'dimensions', 'review_status']) {
      if (!entry[key]) addError(item, `missing required field ${key}`);
    }
    if (!validHash(entry.sha256)) addError(item, 'sha256 must be 64 lower-case hexadecimal characters');
    if (!Number.isInteger(entry.dimensions?.width) || entry.dimensions.width < 1 || !Number.isInteger(entry.dimensions?.height) || entry.dimensions.height < 1) {
      addError(item, 'dimensions must contain positive integer width and height');
    }
    if (entry.review_status !== 'staged') addError(item, 'synthetic staged manifest entries must remain staged');
    for (const subject of entry.identified_subjects || []) {
      if (!subject.entity_type || !subject.resolution_state) addError(item, 'identified subjects need entity_type and resolution_state');
      if (subject.resolution_state === 'resolved' && !subject.id) addError(item, 'resolved subject must include canonical id');
    }
  }
}

for (const file of walk(root)) {
  const relative = path.relative(root, file);
  const extension = path.extname(file).toLowerCase();
  if (!['.json', '.md', '.gitignore'].includes(extension) && path.basename(file) !== '.gitignore') addError(relative, 'unexpected file type; screenshot binaries are not permitted');
  if (extension !== '.json') continue;
  const value = readJson(file);
  if (!value) continue;
  if (relative.endsWith('.schema.json')) continue;
  if (relative.endsWith('.example.json')) {
    if (value.record_type === 'screenshot_manifest') validateManifest(file, value);
    continue;
  }
  const directoryState = relative.split(path.sep)[0];
  if (typeof value !== 'object' || Array.isArray(value)) {
    addError(relative, 'collection must be an object');
    continue;
  }
  if (!states.has(directoryState)) {
    addError(relative, 'record JSON must live under staged/, reviewed/, or canonical/');
    continue;
  }
  for (const key of ['schema_version', 'record_type', 'state', 'records']) if (!(key in value)) addError(relative, `missing collection field ${key}`);
  if (value.state !== directoryState) addError(relative, `collection state ${value.state} does not match directory ${directoryState}`);
  if (!Array.isArray(value.records)) {
    addError(relative, 'records must be an array');
    continue;
  }
  if (!requiredByType[value.record_type]) {
    addError(relative, `unknown record_type ${value.record_type}`);
    continue;
  }
  collections.push({ file: relative, state: directoryState, type: value.record_type, records: value.records });
}

const byType = new Map(Object.keys(requiredByType).map((type) => [type, new Map()]));
const canonicalIds = new Set();
for (const collection of collections) {
  for (const [index, record] of collection.records.entries()) {
    const where = `${collection.file}#${index}`;
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      addError(where, 'record must be an object');
      continue;
    }
    for (const field of requiredByType[collection.type]) if (record[field] === undefined || record[field] === null || record[field] === '') addError(where, `missing required id/field ${field}`);
    if (record.record_state && record.record_state !== collection.state) addError(where, `record_state ${record.record_state} does not match collection state ${collection.state}`);
    if (typeof record.id !== 'string') continue;
    const entityKey = `${collection.type}:${record.id}`;
    const map = byType.get(collection.type);
    if (map.has(record.id)) addError(where, `duplicate ${collection.type} id ${record.id} (also ${map.get(record.id).where})`);
    else map.set(record.id, { record, state: collection.state, where });
    if (collection.state === 'canonical') {
      if (canonicalIds.has(entityKey)) addError(where, `duplicate canonical id ${entityKey}`);
      canonicalIds.add(entityKey);
    }
    if (collection.type === 'claims' && !provenanceClasses.has(record.provenance)) addError(where, `unknown provenance class ${record.provenance}`);
    if (collection.type === 'champion_variants' && collection.state === 'canonical' && record.resolution_state !== 'resolved') addError(where, 'unresolved champion variant cannot be canonical');
    if (collection.type === 'evidence_sources' && !validHash(record.sha256)) addError(where, 'evidence sha256 must be 64 lower-case hexadecimal characters');
  }
}

const recordsFor = (type) => [...byType.get(type).values()];
const hasRecord = (type, id) => byType.get(type)?.has(id);
const evidenceHashes = new Map();
for (const entry of recordsFor('evidence_sources')) {
  const hash = entry.record.sha256;
  if (!validHash(hash)) continue;
  if (evidenceHashes.has(hash)) addError(entry.where, `duplicate evidence hash also used by ${evidenceHashes.get(hash)}`);
  else evidenceHashes.set(hash, entry.where);
  if (entry.record.superseded_by && !hasRecord('evidence_sources', entry.record.superseded_by)) addError(entry.where, `superseded_by references unknown evidence ${entry.record.superseded_by}`);
  for (const subject of entry.record.identified_subjects || []) {
    if (subject.resolution_state === 'resolved') {
      const entityType = subject.entity_type === 'champion_variant' ? 'champion_variants' : subject.entity_type === 'character' ? 'characters' : null;
      if (!entityType || !hasRecord(entityType, subject.id)) addError(entry.where, `evidence points to unknown resolved subject ${subject.entity_type}:${subject.id}`);
    }
    if (entry.state === 'canonical' && subject.resolution_state !== 'resolved') addError(entry.where, 'canonical evidence cannot retain unresolved subject identity');
  }
}

const evidenceLinksByClaim = new Map();
for (const entry of recordsFor('claim_evidence')) {
  const record = entry.record;
  if (!hasRecord('claims', record.claim_id)) addError(entry.where, `claim_evidence references unknown claim ${record.claim_id}`);
  if (!hasRecord('evidence_sources', record.evidence_source_id)) addError(entry.where, `claim_evidence references unknown evidence ${record.evidence_source_id}`);
  if (!['supports', 'contradicts', 'context_only'].includes(record.direction)) addError(entry.where, `unknown evidence direction ${record.direction}`);
  if (record.direction === 'supports') {
    const supportingLinks = evidenceLinksByClaim.get(record.claim_id) || [];
    supportingLinks.push(record);
    evidenceLinksByClaim.set(record.claim_id, supportingLinks);
  }
}

const activeClaimValues = new Map();
for (const entry of recordsFor('claims')) {
  const record = entry.record;
  const subjectType = record.subject?.type;
  const subjectId = record.subject?.id;
  if (!subjectType || !subjectId) addError(entry.where, 'claim subject must contain type and id');
  const subjectCollection = subjectType === 'champion_variant' ? 'champion_variants' : subjectType === 'character' ? 'characters' : null;
  if (subjectCollection && !hasRecord(subjectCollection, subjectId)) addError(entry.where, `claim references unknown subject ${subjectType}:${subjectId}`);
  const requiresEvidence = record.evidence_required !== false;
  if (entry.state === 'canonical' && requiresEvidence && !(evidenceLinksByClaim.get(record.id) || []).length) addError(entry.where, 'canonical claim requires at least one supporting evidence link');
  if (entry.state !== 'canonical' || record.verification_state === 'superseded' || record.verification_state === 'rejected') continue;
  const key = JSON.stringify([subjectType, subjectId, record.predicate, record.context || {}]);
  const value = JSON.stringify(record.object ?? null);
  if (activeClaimValues.has(key) && activeClaimValues.get(key).value !== value) addError(entry.where, `contradictory active claim also present at ${activeClaimValues.get(key).where}`);
  else activeClaimValues.set(key, { value, where: entry.where });
}

for (const entry of recordsFor('relationships')) {
  for (const ref of [entry.record.subject, entry.record.object]) {
    if (!ref?.type || !ref?.id) addError(entry.where, 'relationship subject/object must contain type and id');
    const collection = ref?.type === 'champion_variant' ? 'champion_variants' : ref?.type === 'character' ? 'characters' : null;
    if (collection && !hasRecord(collection, ref.id)) addError(entry.where, `relationship references unknown ${ref.type}:${ref.id}`);
  }
  for (const claimId of entry.record.claim_ids || []) if (!hasRecord('claims', claimId)) addError(entry.where, `relationship references unknown claim ${claimId}`);
}

for (const entry of recordsFor('conflicts')) {
  for (const claimId of entry.record.claim_ids || []) if (!hasRecord('claims', claimId)) addError(entry.where, `conflict references unknown claim ${claimId}`);
  for (const sourceId of entry.record.evidence_source_ids || []) if (!hasRecord('evidence_sources', sourceId)) addError(entry.where, `conflict references unknown evidence ${sourceId}`);
}

console.log(`Canonical data validation inspected ${collections.length} collection file(s) and ${exampleManifestCount} synthetic manifest example(s).`);
if (warnings.length) console.log(`Warnings (${warnings.length}):\n${warnings.map((item) => `- ${item}`).join('\n')}`);
if (errors.length) {
  console.error(`Errors (${errors.length}):\n${errors.map((item) => `- ${item}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Validation passed. No loadable canonical records are present yet.');
}

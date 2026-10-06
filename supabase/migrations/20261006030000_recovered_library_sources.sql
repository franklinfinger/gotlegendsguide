-- Recover original ChatGPT Library bytes for SQLite source IDs 6-8.
-- These cards confirm existing Gregor Clegane facts; cropped continuations
-- remain partial. No OCR wording is promoted by this migration.

INSERT INTO knowledge.source_images
  (source_id, external_id, source_url, original_filename, review_status, confidence)
VALUES
  (6, 'libfile_a9211ec195d88191ad7fc9c191876355', 'library_file_id:libfile_a9211ec195d88191ad7fc9c191876355', '04945F19-6B74-4A85-86B3-06493EF6B6F0_1_105_c.jpeg', 'original_bytes_recovered_visual_checked', 1),
  (7, 'libfile_a5e120f7bee48191bae88218815275d9', 'library_file_id:libfile_a5e120f7bee48191bae88218815275d9', '92FBD173-E019-455B-B04E-70D73DB14310_1_105_c.jpeg', 'original_bytes_recovered_visual_checked', 1),
  (8, 'libfile_aaa05e3988948191901307e9d67f74c7', 'library_file_id:libfile_aaa05e3988948191901307e9d67f74c7', 'B4DCFA2C-C4E3-49F4-9E2C-0E85F9280F79_1_105_c.jpeg', 'original_bytes_recovered_visual_checked', 1)
ON CONFLICT (source_id) DO UPDATE SET
  external_id = EXCLUDED.external_id,
  source_url = EXCLUDED.source_url,
  original_filename = EXCLUDED.original_filename,
  review_status = EXCLUDED.review_status,
  confidence = EXCLUDED.confidence;

INSERT INTO knowledge.source_image_fingerprints
  (source_id, sha256, byte_count, width, height, corpus, content_review_state)
VALUES
  (6, '8e692b524630cdb37dc225249e77a2ec281960b8ffdeae21494e05fd64b04a60', 210147, 601, 1306, 'chatgpt_library_recovered', 'original_bytes_visual_checked'),
  (7, '5ac8a006bf4201d6b242900da97ac4e321674dc6cad97cdf69b79570c58901eb', 195306, 601, 1306, 'chatgpt_library_recovered', 'original_bytes_visual_checked'),
  (8, '57c6de88f88fe4d727112adea03d69825955fc62343d806b9ef1126828907242', 171767, 601, 1306, 'chatgpt_library_recovered', 'original_bytes_visual_checked')
ON CONFLICT (source_id) DO UPDATE SET
  sha256 = EXCLUDED.sha256,
  byte_count = EXCLUDED.byte_count,
  width = EXCLUDED.width,
  height = EXCLUDED.height,
  corpus = EXCLUDED.corpus,
  content_review_state = EXCLUDED.content_review_state;

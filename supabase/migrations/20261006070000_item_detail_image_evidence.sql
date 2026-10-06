-- Additional detail-card image evidence; item identity is OCR matched only.
INSERT INTO knowledge.record_evidence
  (record_kind, record_id, source_id, evidence_role, review_state)
VALUES
  ('iconic_item_catalog', 'sqlite-iconic-item-3', 102456, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-2', 102462, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-4', 102465, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-4', 102466, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-2', 102473, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-4', 102477, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-4', 102478, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-5', 102484, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-7', 102485, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-9', 102490, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-11', 102497, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-19', 3, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-15', 4, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-17', 102525, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-22', 102529, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review')
ON CONFLICT DO NOTHING;

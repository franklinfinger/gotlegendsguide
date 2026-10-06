-- Additional item-card image evidence. Title identity is OCR matched only;
-- ability rank and exact wording remain subject to visual review.
INSERT INTO knowledge.record_evidence
  (record_kind, record_id, source_id, evidence_role, review_state)
VALUES
  ('iconic_item_catalog', 'sqlite-iconic-item-2', 101899, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-1', 101905, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-3', 101910, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-4', 101917, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-5', 101926, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-5', 101927, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-6', 101935, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-7', 101943, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-8', 101949, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-10', 101976, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-11', 101986, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-12', 101996, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-13', 102015, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-14', 102045, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-18', 102063, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-15', 102075, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-16', 102084, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-19', 102089, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-17', 102145, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-21', 102150, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-20', 102159, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-22', 102165, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-24', 102176, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-25', 102202, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-28', 102229, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-27', 102256, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-26', 102266, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-29', 102371, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-30', 102419, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-13', 102507, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review'),
  ('iconic_item_catalog', 'sqlite-iconic-item-3', 102650, 'ocr_item_title_identity_only', 'identity_ocr_pending_visual_review')
ON CONFLICT DO NOTHING;

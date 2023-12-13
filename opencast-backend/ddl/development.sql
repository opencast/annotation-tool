-- Snippet intended to reset own data from testing
-- Adjust to own demands

SET FOREIGN_KEY_CHECKS=0;

TRUNCATE xannotations_annotation;
TRUNCATE xannotations_category;
TRUNCATE xannotations_comment;
TRUNCATE xannotations_label;
TRUNCATE xannotations_questionnaire;
TRUNCATE xannotations_scale;
TRUNCATE xannotations_scale_value;
TRUNCATE xannotations_track;

-- Reset deletion status
UPDATE xannotations_questionnaire SET deleted_at = NULL, deleted_by = NULL WHERE id > 0

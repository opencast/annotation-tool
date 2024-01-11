/*
* MariaDB migration script
* This script should work with the development and previously considered stable versions of Münster and Bern
* Please backup your database and test the script before using it in production!
*/

/* 
    ER diagrams
    - Old questionnaire branch: https://dbdiagram.io/d/627e66787f945876b614323b
    - Old bern branch: https://dbdiagram.io/d/627e66a27f945876b6143441
    - Target branch "next":  https://dbdiagram.io/d/659fd0d2ac844320aeb59799

    Notes
    - These older schemas are provided for migration reference and as examples.
    - Schemas may not include all relationships or may even have incorrect data types.
*/

/*
* Settings
*/
-- Might be needed in some cases:
-- SET SQL_SAFE_UPDATES = 0;
-- SET SQL_NOTES = 0;

START TRANSACTION;

-- Add new columns for migration to merged version (Münster features)
alter table xannotations_annotation
add column if not exists content longtext not null DEFAULT '[]',
add column if not exists createdFromQuestionnaire bigint(20) DEFAULT NULL;

-- Migrate from older versions (e.g. questionnaire branch)
alter table xannotations_annotation
modify createdFromQuestionnaire bigint(20) DEFAULT NULL,
modify content longtext not null DEFAULT '[]',
add column if not exists label_id bigint(20) DEFAULT NULL,
add column if not exists scale_value_id bigint(20) DEFAULT NULL,
add column if not exists text longtext DEFAULT NULL;

SAVEPOINT t0;

-- Add new columns for migration to merged version (Bern features)
alter table xannotations_category
add column if not exists series_category_id bigint(20) DEFAULT NULL,
add column if not exists series_extid bigint(20) DEFAULT NULL;

alter table xannotations_label
add column if not exists series_label_id bigint(20) DEFAULT NULL;

SAVEPOINT t1;

/*
-- Optional datatype alterations

--- Extend comment text length
alter table xannotations_comment
modify text longtext not null;

--- Extend description text length
alter table xannotations_category
modify description mediumtext DEFAULT NULL;

alter xannotations_label
modify description mediumtext DEFAULT NULL;

alter xannotations_scale
modify description mediumtext DEFAULT NULL;

alter xannotations_track
modify description mediumtext DEFAULT NULL;

SAVEPOINT tdt;
*/

/*
 Migrate content
*/

-- Free text annotations
update xannotations_annotation
set content = concat('[{"type":"text","value":', json_quote(text), '}]')
where scale_value_id is null
and label_id is null;

SAVEPOINT t2;

-- Annotations with just a label
update xannotations_annotation
set content = concat('[{"type":"label","value":', label_id, '}]')
where scale_value_id is null
and label_id is not null;

SAVEPOINT t3;

-- Annotations with a scale value
update xannotations_annotation
set content = concat('[{"type":"scaling","value":{"label":', label_id, ',"scaling":', scale_value_id, '}}]')
where scale_value_id is not null;

SAVEPOINT t4;

-- Annotations with empty values, providing default value
update xannotations_annotation
set content = '[]'
where content is null;

SAVEPOINT t5;

/*
*   Annotation templates feature
*   You might want to adjust charset and collate to suit your database
*/

-- Create new table structure for annotation templates
CREATE TABLE IF NOT EXISTS `xannotations_questionnaire` (
  `id` bigint(20) NOT NULL,
  `access` int(11) DEFAULT NULL,
  `content` longtext NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT NULL,
  `settings` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT NULL,
  `video_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `xannotations_questionnaire_video_id` (`video_id`),
  CONSTRAINT `xannotations_questionnaire_video_id` FOREIGN KEY (`video_id`) REFERENCES `xannotations_video` (`id`),
  KEY `xannotations_questionnaire_updated_by` (`updated_by`),
  CONSTRAINT `xannotations_questionnaire_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `xannotations_user` (`id`),
  KEY `xannotations_questionnaire_deleted_by` (`deleted_by`),
  CONSTRAINT `xannotations_questionnaire_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `xannotations_user` (`id`),
  KEY `xannotations_questionnaire_created_by` (`created_by`),
  CONSTRAINT `xannotations_questionnaire_created_by` FOREIGN KEY (`created_by`) REFERENCES `xannotations_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `xannotations_questionnaire_tags` (
  `questionnaire_id` bigint(20) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  KEY `xannotations_questionnaire_tags_questionnaire_id` (`questionnaire_id`),
  CONSTRAINT `xannotations_questionnaire_tags_questionnaire_id` FOREIGN KEY (`questionnaire_id`) REFERENCES `xannotations_questionnaire` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*
 Cleanup
*/

-- Drop deprecated foreign keys
alter table xannotations_annotation
drop constraint if exists FK_xannotations_annotation_label_id,
drop constraint if exists FK_xannotations_annotation_scale_value_id;

-- Drop columns deprecated by MCA (new: content column)
alter table xannotations_annotation
drop column if exists text,
drop column if exists label_id,
drop column if exists scale_value_id;

-- Drop Category.hasDuration?
-- alter table xannotations_category
-- drop column if exists has_duration;

COMMIT;
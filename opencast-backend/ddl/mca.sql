-- TODO This is MariaDB-specific. What about other databases?!
-- TODO Transactions?

alter table xannotations_annotation
add content text;

-- Free text annotations
update xannotations_annotation
set content = concat('[{"type":"text","value":', json_quote(text), '}]')
where scale_value_id is null
and label_id is null;

-- Annotations with just a label
update xannotations_annotation
set content = concat('[{"type":"label","value":', label_id, '}]')
where scale_value_id is null
and label_id is not null;

-- Annotations with a scale value
update xannotations_annotation
set content = concat('[{"type":"scaling","value":{"label":', label_id, ',"scaling":', scale_value_id, '}}]')
where scale_value_id is not null;

alter table xannotations_annotation
modify content text not null default '[]',
drop text,
drop label_id,
drop scale_value_id;

# Rest API 


##[Login and User Handling](Login-and-User-Handling)
##[General Status Codes and Messages](General-Status-Codes-and-Messages)

## Resources
* [User](rest-user.md)
* [Video](rest-video.md)
* [Track](rest-track.md)
* [Annotation](rest-annotation.md)
* [Category](rest-category.md)
* [Label](rest-label.md)
* [Scale](rest-scale.md)
* [Scale value](rest-scalevalue.md)
* [Comment](rest-comment.md)

## Data passing

For all the create and update operations the ressources attributes will be passed as query parameters and sent in the HTTP body with content-type [`application/x-www-form-urlencoded`](http://en.wikipedia.org/wiki/Application/x-www-form-urlencoded#The_application.2Fx-www-form-urlencoded_type).

## Operations loggings<a name="logging"></a>

| Name | Type | Description | Default |
| ------ | ----- | ----- | -----: |
|  access[\*](#required) ([0 = private, 1 = public])  |  `Integer` | Access to the Resource | 0 (private) |
| created_at[\*](#required)  |  [`Time`](#time)   | Resource creation date. | NULL |
| created_by[\*](#required)  |  `Integer`| Resource creator user_id. | NULL |
| updated_at[\*](#required)  | [`Time`](#time) | The update logs. **Already filled at creation (same as created_at)**| NULL |
| updated_by[\*](#required)  |  `Integer` | The update logs user_id. **Already filled at creation (same as created_by)** | NULL |
| deleted_at[\*](#required)  | [`Time`](#time)  | The delete log. | NULL |
| deleted_by[\*](#required)  |  `Integer`| The delete log user_id. | NULL |
| created_by_nickname [\*](#required)  |  `String`| Resource creator nickname. | NULL |
| updated_by_nickname [\*](#required)  |  `String` | The update logs nickname. | NULL |
| deleted_by_nickname [\*](#required)  |  `String`| The delete log nickname. | NULL |

<a name="required">* = required</a>

Backend generates `created_by_nickname` from `created_by`.


### Time<a name="time"></a>

Time format is `Combined date and time in UTC:  2012-05-16T07:09Z` defined in ISO 8601.

## Reset operation

To allow the cleaning of the database after the unit tests, a reset Rest Endpoint has to be implemented. 

It must have the following URI with the delete operation: 

**DELETE** `ROOT/VERSION/reset` 

## Statistics export (CSV)

All the annotations can be exported as a CSV file, including all relevant data of the annotation.

**GET** `ROOT/VERSION/export.csv` 

Sample response:
[export.csv](https://gist.github.com/4619611)

## Tags<a name="tags"></a>

| Name | Type | Description | Default |
| ------ | ------ | ----- | ----- | -----: |
| tags | `String` | Array of JSON key/value tag as URL encoded String. `{"key":"value", "key":"value"}`. Returned as object. | NULL |

Tag is a new optional field created to add a possible scope information. For example, with the futur addition of channel scope, a category could contains a tag "{'channel_id':'1234'}". It would logically mean that this category is related to the mathematics channel. 

A tags field could contains more tags, simply comma-separated. 

To simply querying on it, a new list query parameter should be implemented. See [here below](#wiki-tags-query) under the list queries.

For video, category, track and annotation, a tag named "channel_id" can be present to defined the entity scope.


## [Upcoming](Roadmap.md): List queries <a name="list-queries"></a>

For query on list like on [tracks](rest-track#getAll), [annotations](rest-annotation#getAll) or [categories](rest-category#wiki-getAll) different url parameters are accepted. They are always the same for all the list queries.

**The frontend does not use the list querying in the current version.** 

### Parameters<a name="listparam"></a>

| Name | Type | Description | Default | Example | concerned elements |
| ------ | ------ | ----- | ----- | ----- | ----- |-----: |
| limit|`Integer`|Maximum number of results accepted, omit or -1 = unlimited|null|`http://resource_url?limit=56` for max 56 results| all |
| offset|`Integer`|Define the offset for the wanted results, mainly used for pagination.|0|`http://resource_url?offset=4`, return items since 5th result.(Offset: 0 => [1,2,3,4,5,6,7,8], Offset: 4 => [5,6,7] )| all |
| start|`Decimal`| Define that the queries concerns all the annotations being displayed from this timepoint. |null|`http://resource_url?start=4.5` for all the annotations starting after the 4.5 second or being displayed at this moment | [Annotation](rest-annotation)  |
| end|`Decimal`| Define that the queries concerns all the annotations being displayed before this timepoint. |null|`http://resource_url?end=14.5` for all the annotations starting before the 14.5 second or being displayed at this moment. | [Annotation](rest-annotation) |
| - *_at| `Time` | Return all items created, updated, deleted items in a given time range, omit the second parameter to get since fictionality   | | `http://resource_url` `?created_at=[2012-05-16T00:00Z,2012-05-20T00:00Z]`; since: `http://resource_url?created_at=[2012-05-16T00:00Z]` (`[` becomes `%5B` and `]` = `%5D`) |all|
| - *_by|`Integer`| Return all items of a resource created / updated / deleted by the given user.||`http://resource_url?updated_by=1213`| all |
|- user_details|`full` or `nickname`| Returns the User details as a nested json object or the users nickname  (instead of just the id).| ||all|
|- tags-and <a name="wiki-tags-query"/>|`String`| Return the entites having **all** the given list of tag  in a JSON array as URL encoded string. | ||all|
|- tags-or |`String`| Return the entites with **one or more** tag from the given tags in JSON array as URL encoded string. | ||all|





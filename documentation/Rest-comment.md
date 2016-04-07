# Comment

[< Rest API documentation](Rest-API.md)

### Base URI

The comment resources are related to an annotation. The base path for them is 

`http://api.annotationstool.com/v1/videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}/comments`

### Attributes
| Name | Type | Description | Default |
| ------ | ----- | ----- | -----: |
| id[\*](#required)   |  `Long` | The comment id. | Generated at creation |
| text[\*](#required) | `String` | The comment text. | EMPTY |
| _**+**_  | [logging attributes](rest-api#wiki-logging)|

<a name="required">* = required</a>

### Operations 
*  **[Add a new comment to an annotation](#create)**
*  **[Get a comment](#get)**
*  **[Get all comments from an annotation](#getAll)**
*  **[Update or create a comment](#update)**
*  **[Delete a comment](#delete)** 

## Add a new comment to an annotation<a name="create"/>

Add the given comment to the annotation with id _annotationId_. The comment id must not be given.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  POST  | /videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}/comments | text | `201 Created`: Resource created, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `409 conflict`: Resource already exist, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**POST** `http://api.annotationstool.com/v1/videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}/comments`
#### _Content_
`text=Dies ist ein Kommentar`

### Response content
Location parameter in header give the URI from the new resource. 

NO CONTENT

## Get a comment<a name="get"/>

Get the comment with the id _commentId_ 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  | /videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}/comments/#{commentId} | NONE | `200 Ok`: Resource returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1/videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}/comments/12`
#### _Content_
NO CONTENT
#### Response content
```javascript
{
 id: 12,
 text: 'Dies ist ein Kommentar',
 access: 0,
 updated_by: 123,
 updated_at: 32421410,
 created_by: 123,
 created_at: 32421410 
}
```

## Get all comments from an annotation<a name="getAll"/>

Query comments from an annotation. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  | /videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}/comments | [list queries parameters](rest-api.md#wiki-listparam) | `200 Ok`: Resources returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1/videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}/comments?limit=4`
#### _Content_
NO CONTENT
### Response content
```javascript
{
 count: 4, // Result length
 offset: 0, // Offset parameter to use in case of pagination needs
 comments: [
        {
 		id: 12,
 		text: 'Dies ist ein Kommentar',
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421410,
 		created_by: 123,
 		created_at: 32421410 
	},
        {
 		id: 13,
 		text: 'Hallo Welt', 
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421411,
 		created_by: 123,
 		created_at: 32421411 
	},
	{
 		id: 14,
 		name: 'Sehr gute Annotation', 
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421412,
 		created_by: 123,
 		created_at: 32421412 
	},
	{
 		id: 15,
 		name: 'Diese Annotation ist falsch', 
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421412,
 		created_by: 123,
 		created_at: 32421412 
	}
 ]
}
```

## Update or create a comment<a name="update"/>

Update the comment with the given _commentId_ or create a new one with this _commentId_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  PUT  |  /videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}/comments/#{commentId} | text  | `200 Ok`: Resource modified, `201 created`: Resource created. |


### Example Request
#### _Url_
**PUT** `http://api.annotationstool.com/v1/videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}/comments/12`
#### _Content_
text=Dies ist ein Kommentar
#### _Response Content_
```javascript
{
 id: 12,
 text: 'Dies ist ein Kommentar'
}
```

#### _Response Header_
Location parameter in header give the URI from the new resource.

## Delete a comment<a name="delete"/>
Delete the comment with id _commentId_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  DELETE  | /videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}/comments/#{commentId} | NONE | `204 No content`: Resource deleted, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found. |

### Example request
#### _Url_
**DELETE** `http://api.annotationstool.com/v1/videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}/comments/12`
#### _Content_
NO CONTENT
#### _Response content_
NO CONTENT

[< Rest API documentation](Rest-API.md)
[1]: rest-get-parameters

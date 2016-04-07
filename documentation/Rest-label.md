# Label

[< Rest API documentation](Rest-API)

The label resources are related to a [category](Rest-category). The base path for them is `http://api.annotationstool.com/v1/categories/#{categoryId}/labels`.

### Base URI

`http://api.annotationstool.com/v1/categories/#{categoryId}/labels` for the label related to the template categorie.
`http://api.annotationstool.com/v1/videos/#{videoId}/categories/#{categoryId}/labels` for the category attached to a video. 

### Attributes

| Name | Type | Description | Default |
| ------ | ------ | ----- | ----- | -----: |
| id[\*](#required)  |  `Long` | The label id. | Generated at creation |
| value[\*](#required)  |  `String` | The label value. | EMPTY |
| abbreviation[\*](#required)  |  `String` | The label abriaviation. Should not be more than 2-3 characters. | EMPTY |
| description  |  `String` | The label description. | EMPTY |
| category[\*](#required)  | [`category as JSON Object`](rest-category) | Parent category of this label. | EMPTY |
| settings | `String` | Dictionnary of diverse metadata related to the label. | NULL |
| _**+**_  | [logging attributes](rest-api#wiki-logging)|

<a name="required">* = required</a>


### Operations 

*  **[Add a new label to a category](#create)**
*  **[Get a label](#get)**
*  **[Get all labels from a category](#getAll)**
*  **[Update a label](#update)**
*  **[Delete a label](#delete)**

## Add a new label to a category<a name="create"/>

Add the given label to the category with id _categoryId_. The label id must not be given . Anyway it will be overwritten. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  POST  |  /videos/#{videoId}/categories/#{categoryId}/labels or /categories/#{categoryId}/labels| NONE | `201 Created`: Resource created, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `409 conflict`: Resource already exist, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**POST** `http://api.annotationstool.com/v1/categories/123/labels`
#### _Content_
`abreviation=%3A)&description=Label+for+happiness&color=44FF&picture=%2Fimages%2Flabels%2Fhappy.png&value=Happy&access=1`
#### _Response content_
Location parameter in header give the URI from the new resource. 

```javascript
{
 id: 1,
 abreviation: ':)', 
 description: 'Label for happiness',
 color: '44FF',
 picture: '/images/labels/happy.png',
 value: 'Happy',
 category: {
 	id: 23,
 	name: 'Feelings', 
 	description: 'Category containing the feelings visible in the video',
 	has_duration: true,
 },
 access: 1,
 updated_by: 123,
 updated_at: 32421410,
 created_by: 123,
 created_at: 32421410, 
}
```

## Get a label<a name="get"/>

Get a label with the id _labelId_ 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  |  /videos/#{videoId}/categories/#{categoryId}/labels or /categories/#{categoryId}/labels/#{labelId} | NONE | `200 Ok`: Resource returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side.|

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1/categories/123/labels/1`
#### _Content_
NO CONTENT
#### _Response content_
```javascript
{
 id: 1,
 abreviation: ':)', 
 description: 'Label for happiness',
 color: '44FF',
 picture: '/images/labels/happy.png',
 value: 'Happy',
 category: {
 	id: 23,
 	name: 'Feelings', 
 	description: 'Category containing the feelings visible in the video',
 	has_duration: true,
 },
 access: 1,
 updated_by: 123,
 updated_at: 32421410,
 created_by: 123,
 created_at: 32421410, 
}
```

## Get all labels from a category<a name="getAll"/>

Query labels from a category. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  |  /videos/#{videoId}/categories/#{categoryId}/labels or /categories/#{categoryId}/labels | [list queries parameters](rest-api#wiki-listparam) | `200 Ok`: Resources returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Default sorting 

By default, the labels list should be sorted by value. 

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/categories/123/labels?limit=2`
#### _Content_
NO CONTENT
#### _Response content_
```javascript
{
 count: 2, // Result length
 offset: 0, // Offset parameter to use in case of pagination needs
 elements: {
    0: {
 		id: 1,
 		abreviation: ':)', 
 		description: 'Label for happiness',
 		color: '44FF',
 		picture: '/images/labels/happy.png',
 		value: 'Happy',
 		category: {
 			id: 23,
 			name: 'Feelings', 
 			description: 'Category containing the feelings visible in the video',
 			has_duration: true,
 		},
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421410,
 		created_by: 123,
 		created_at: 32421410, 
	},
    1: {
 		id: 22,
 		abreviation: ':(', 
 		description: 'Label for sadness',
 		color: '88EE',
 		picture: '/images/labels/sad.png',
 		value: 'Sad',
 		category: {
 			id: 23,
 			name: 'Feelings', 
 			description: 'Category containing the feelings visible in the video',
 			has_duration: true,
 		},
 		access: 1,
 		updated_by: 123,
 		updated_at: 32421410,
 		created_by: 123,
 		created_at: 32421410, 
	},
 }
}
```

## Update a label<a name="update"/>

Update the label with the given _labelId_ or create a new one with this _labelId_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  PUT  |  /videos/#{videoId}/categories/#{categoryId}/labels or /categories/#{categoryId}/labels/#{labelId} | NONE  | `200 Ok`: Resource modified, `201 created`: Resource created, `304 Not Modified` : Resource not modified, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**PUT** `http://api.annotationstool.com/v1/categories/123/labels/1`
#### _Content_
Send the resource parameters as query parameters.
`abreviation=%3A)&description=Label+for+happiness&color=44FF&picture=%2Fimages%2Flabels%2Fhappy.png&value=Happy&access=0`
#### _Response content_
Return the status code corresponding the operation done and the Location in the header if resource created.

```javascript
{
 id: 1,
 abreviation: ':)', 
 description: 'Label for happiness',
 color: '44FF',
 picture: '/images/labels/happy.png',
 value: 'Happy',
 category: {
 	id: 23,
 	name: 'Feelings', 
 	description: 'Category containing the feelings visible in the video',
 	has_duration: true,
 },
 access: 0,
 updated_by: 123,
 updated_at: 32423910,
 created_by: 123,
 created_at: 32421410, 
}
```

## Delete a label<a name="delete"/>
Delete the label with id _labelId_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  DELETE  |  /videos/#{videoId}/categories/#{categoryId}/labels or /categories/#{categoryId}/labels/#{labelId}  | NONE | `204 No content`: Resource deleted, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found. |

### Example request
#### _Url_
**DELETE** `http://api.annotationstool.com/v1/categories/123/labels/1`
#### _Content_
NO CONTENT
#### _Response content_
NO CONTENT

[< Rest API documentation](Rest-API)
[1]: rest-get-parameters
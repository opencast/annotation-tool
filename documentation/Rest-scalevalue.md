# Scale value


[< Rest API documentation](Rest-API.md)

### Base URI
The scale value resources are related to a [scale](Rest-scale.md). The base path for them is 

`http://api.annotationstool.com/v1/scales/#{scaleId}/scalevalues` for "template" scales
`http://api.annotationstool.com/v1/videos/#{videoId}/scales/#{scaleId}/scalevalues` for normal scales

### Attributes

| Name | Type | Description | Default |
| ------ | ------ | ----- | ----- | -----: |
| id[\*](#required)   |  `Long` | The scale value id. | Generated at creation |
| name[\*](#required)   |  `String` | The scale value name. | EMPTY |
| value[\*](#required)   | `Decimal` | The scale value as decimal. | 0 |
| order[\*](#required)  | `Integer` | The order of the scale value in the scale values list. | 0 |
| scale[\*](#required)  | [`scale as JSON Object`](rest-scale) | The scale containing this scale value. | EMPTY |
| _**+**_  | [logging attributes](rest-api#wiki-logging)|

<a name="required">* = required</a>

### Operations 

*  **[Add a new value to a scale](#create)**
*  **[Get a scale value](#get)**
*  **[Get all value from a scale](#getAll)**
*  **[Update a scale value](#update)**
*  **[Delete a scale value](#delete)**

## Add a new value to a scale<a name="create"/>

Add the given value to the scale with id _scaleId_. The scale value id must not be given . Anyway it will be overwritten. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  POST  | /scales/#{scaleId}/scalevalues or /videos/#{videoId}/scales/#{scaleId}/scalevalues | NONE | `201 Created`: Resource created, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `409 conflict`: Resource already exist, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**POST** `http://api.annotationstool.com/v1//videos/123/scales/2/scalevalues`
#### _Content_
`name=Extraordinary&value=10&order=10`

### Response content
Location parameter in header give the URI from the new resource. 

NO CONTENT

## Get a scale value<a name="get"/>

Get the scale value with the id _scalevalueId_ 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  | /scales/#{scaleId}/scalevalues/#{scalevalueId} or /videos/#{videoId}/scales/#{scaleId}/scalevalues/#{scalevalueId} | NONE | `200 Ok`: Resource returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1//videos/123/scales/2/scalevalues/12`
#### _Content_
NO CONTENT
#### Response content
```javascript
{
 id: 12,
 name: 'Extraordinary', 
 value: 10,
 order: 10,
 scale: {
 	id: 2,
 	name: 'Work quality', 
 	description: 'Scale to define the quality of the work presented.'
 },
 access: 0,
 updated_by: 123,
 updated_at: 32421410,
 created_by: 123,
 created_at: 32421410 
}
```

## Get all scale values from a scale<a name="getAll"/>

Query values from a scale. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  | /scales/#{scaleId}/scalevalues/#{scalevalueId} or /videos/#{videoId}/scale/#{scaleId}/scalevalues | [list queries parameters](rest-api.md#wiki-listparam) | `200 Ok`: Resources returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1/videos/123/scales/2/scalevalues?limit=4`
#### _Content_
NO CONTENT
### Response content
```javascript
{
 count: 4, // Result lenght
 offset: 0, // Offset parameter to use in case of pagination needs
 elements: [
        {
 		id: 12,
 		name: 'Extraordinary', 
 		value: 10,
 		order: 10,
 		scale: {
 			id: 2,
 			name: 'Work quality', 
 			description: 'Scale to define the quality of the work presented.'
 		},
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421410,
 		created_by: 123,
 		created_at: 32421410 
	},
        {
 		id: 13,
 		name: 'Excellent', 
 		value: 9,
 		order: 9,
 		scale: {
 			id: 2,
 			name: 'Work quality', 
 			description: 'Scale to define the quality of the work presented.'
 		},
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421411,
 		created_by: 123,
 		created_at: 32421411 
	},
	{
 		id: 14,
 		name: 'Well done', 
 		value: 8,
 		order: 8,
 		scale: {
 			id: 2,
 			name: 'Work quality', 
 			description: 'Scale to define the quality of the work presented.'
 		},
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421412,
 		created_by: 123,
 		created_at: 32421412 
	},
	{
 		id: 15,
 		name: 'Good', 
 		value: 7,
 		order: 7,
 		scale: {
 			id: 2,
 			name: 'Work quality', 
 			description: 'Scale to define the quality of the work presented.'
 		},
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421413,
 		created_by: 123,
 		created_at: 32421413 
	}
 ]
}
```

## Update a scale value<a name="update"/>

Update the scale value with the given _scalevalueId_ or create a new one with this _scalevalueId_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  PUT  | /scales/#{scaleId}/scalevalues/#{scalevalueId} or /videos/#{videoId}/scales/#{scaleId}/scalevalues/#{scalevalueId}| NONE  | `200 Ok`: Resource modified, `201 created`: Resource created, `304 Not Modified` : Resource not modified, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |


### Example request
#### _Url_
**PUT** `http://api.annotationstool.com/v1/videos/123/scales/2/scalevalues/12`
#### _Content_
Send the resource parameters as query parameters.

`name=Extraordinary&value=8&order=8`

#### _Response content_
Return the status code corresponding the operation done and the Location in the header if resource created.

```javascript
{
 		id: 12,
 		name: 'Extraordinary', 
 		value: 8,
 		order: 8,
 		scale: {
 			id: 2,
 			name: 'Work quality', 
 			description: 'Scale to define the quality of the work presented.'
 		},
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421890,
 		created_by: 123,
 		created_at: 32421410 
}
```

## Delete a scale value<a name="delete"/>
Delete the scale value with id _scalevalueId_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  DELETE  | /scales/#{scaleId}/scalevalues/#{scalevalueId} or videos/#{videoId}/scales/#{scaleId}/scalevalues/#{scalevalueId} | NONE | `204 No content`: Resource deleted, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found. |

### Example request
#### _Url_
**DELETE** `http://api.annotationstool.com/v1/videos/123/scales/2/scalevalues/12`
#### _Content_
NO CONTENT
#### _Response content_
NO CONTENT

[< Rest API documentation](Rest-API.md)
[1]: rest-get-parameters

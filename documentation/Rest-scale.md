# Scale


[< Rest API documentation](Rest-API.md)

### Base URI

`http://api.annotationstool.com/v1/scales` for "template" scale.

`http://api.annotationstool.com/v1/videos/#{videoId}/scales` for copy of template.

### Attributes

| Name | Type | Description | Default |
| ------ | ------ | ----- | ----- |
| id[\*](#required)  |  `Long` | The scale value id. | Generated at creation |
| name[\*](#required)  |  `String` | The scale value name. | EMPTY |
| description  | `String` | The scale description. | EMPTY |
| tags | `String` | String of related tags. | NULL |
| _**+**_  | [logging attributes](rest-api#wiki-logging)|

<a name="required">* = required</a>


### Operations 

*  **[Add a new scale to a category](#create)**
*  **[Get a scale](#get)**
*  **[Get all scale from a category](#getAll)**
*  **[Update a scale](#update)**
*  **[Delete a scale](#delete)**

## Add a new scale to a category<a name="create"/>

Add the given scale to the video with id _videoId_. The scale id must not be given . Anyway it will be overwritten. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  POST  |  /scales or /videos/#{videoId}/scales | NONE | `201 Created`: Resource created, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `409 conflict`: Resource already exist, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**POST** `http://api.annotationstool.com/v1/videos/123/scales`
#### _Content_
`name=Work+quality&description=Scale+to+define+the+quality+of+the+work+presented`
### Response content
Location parameter in header give the URI from the new resource. 

```javascript
{
 id: 2,
 name: 'Work quality', 
 description: 'Scale to define the quality of the work presented.',
 access: 0,
 updated_by: 123,
 updated_at: 32421410,
 created_by: 123,
 created_at: 32421410, 
}
```

## Get a scale value<a name="get"/>

Get the scale value with the id _scaleId_ 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  | /scales/#{scaleId} or /videos/#{videoId}/categories/scales/#{scaleId} | NONE | `200 Ok`: Resource returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1/videos/123/scales/2`
#### _Content_
NO CONTENT
#### Response content
```javascript
{
 id: 2,
 name: 'Work quality', 
 description: 'Scale to define the quality of the work presented.',
 access: 0,
 updated_by: 123,
 updated_at: 32421410,
 created_by: 123,
 created_at: 32421410, 
}
```

## Get all scales<a name="getAll"/>

Query scales from a video. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  |  /scales/#{scaleId} or /videos/#{videoId}/scales | [list queries parameters](rest-api.md#wiki-listparam) | `200 Ok`: Resources returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1/videos/123/scales?limit=2`
#### _Content_
NO CONTENT
### Response content
```javascript
{
 count: 2, // Result lenght
 offset: 0, // Offset parameter to use in case of pagination needs
 elements: [
        {
 		 id: 2,
 		name: 'Work quality', 
		description: 'Scale to define the quality of the work presented.',
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421410,
 		created_by: 123,
 		created_at: 32421410 
	},
	...
 }
}
```

## Update a scale<a name="update"/>

Update the scale with the given _scaleId_ or create a new one with this _scaleId_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  PUT  |  /scales/#{scaleId} /videos/#{videoId}/scales/#{scaleId} | NONE  | `200 Ok`: Resource modified, `201 created`: Resource created, `304 Not Modified` : Resource not modified, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |


### Example request
#### _Url_
**PUT** `http://api.annotationstool.com/v1/videos/123/scales/2`
#### _Content_
Send the resource parameters as query parameters.

`name=Work+quality+for+students+projects&description=Scale+to+define+the+quality+of+the+work+presented`
#### _Response content_
Return the status code corresponding the operation done and the Location in the header if resource created.

```javascript
{
 id: 2,
 name: 'Work quality', 
 description: 'Scale to define the quality of the work presented.',
 access: 0,
 updated_by: 123,
 updated_at: 32421445,
 created_by: 123,
 created_at: 32421410, 
}
```

## Delete a scale<a name="delete"/>
Delete the scale value with id _scaleId_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  DELETE  |  /scales/#{scaleId} or /videos/#{videoId}/scales/#{scaleId} | NONE | `204 No content`: Resource deleted, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found. |

### Example request
#### _Url_
**DELETE** `http://api.annotationstool.com/v1/videos/123/scales/2`
#### _Content_
NO CONTENT
#### _Response content_
NO CONTENT

[< Rest API documentation](Rest-API.md)
[1]: rest-get-parameters

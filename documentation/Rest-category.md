#Category

[< Rest API documentation](Rest-API.md)

The category resources are related to a [video](Rest-video.md). Enhanced [annotation](Rest-annotation) are based on [label](Rest-label.md) that are grouped in category. The base path for categories is `http://api.annotationstool.com/v1/videos/#{videoId}/categories`. But of course a category can be supported by multiple videos. To work on unique categories the following path can be used `http://api.annotationstool.com/v1/categories`.

### Base URI

`http://api.annotationstool.com/v1/categories` for "template" categories.
`http://api.annotationstool.com/v1/videos/#{videoId}/categories` for copied categories from template.

### Attributes

| Name | Type | Description | Default |
| ------ | ------ | ----- | ----- |
| id[\*](#required)  |  `Long` | The category id. | Generated at creation |
| name[\*](#required)  |  `String` | The category name. | EMPTY |
| description  |  `String` | The category description. | EMPTY |
| scale_id | [`Scale id`](Rest-scale`) | The scale that can be used for this category. | NULL |
| settings | `String` | Dictionnary of diverse metadata related to the category | NULL |
| tags | `String` | String of related tags. | NULL |
| _**+**_  | [logging attributes](rest-api#wiki-logging)|

<a name="required">* = required</a>

### Operations 

*  **[Create a new category](#create)**
*  **[Add a category to a video](#add)**
*  **[Get a category](#get)**
*  **[Get all categories](#getAll)**
*  **[Get all categories supported by a video](#getAllproVideo)**
*  **[Update a category](#update)**
*  **[Delete a category](#delete)**

## Create a new category<a name="create"/>

Create a new "template" category.  

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  POST  |  /categories | NONE | `201 Created`: Resource created, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `409 conflict`: Resource already exist, `500 Internal server error`: Error happened on the server side. |



### Example request
#### _Url_
**POST** `http://api.annotationstool.com/v1/videos/123/categories`
#### _Content_
`name=Feelings&description=Category+containing+the+feelings+visible+in+the+video&scale_id=4
### Response content
Location parameter in header give the URI from the new resource. 

```javascript
{
 id: 23,
 name: 'Feelings', 
 description: 'Category containing the feelings visible in the video',
 scale_id: 12,
 access: 0,
 updated_by: 123,
 updated_at: 32421410,
 created_by: 123,
 created_at: 32421410, 
}
```

## Add a category to a video<a name="add"/>

Add a given category to the video with id _videoId_. The category (with the id _category_id_) will be copied and attached to the video. The label and the scale from the template category will also be copied to the category copy.

* The category will be copied from `/categories/#{categoryId}` to `/videos/#{videoId}/categories/#{newCopyCategoryId}`.

* The labels will be copied from `/categories/#{categoryId}/labels` to `/videos/#{videoId}/categories/#{newCopyCategoryId}/labels`. All the copy of the labels will then have new id. 

* The scale will be copied from `/scales/#{scaleId}` to `/videos/#{videoId}/scales/#{newCopyScaleId}`.

* The scale values will be copied from `/scales/#{scaleId}/scalevalues` to `/videos/#{videoId}/scales/#{scaleId}/scalevalues`. All the copy of the scale vaules will then have new id. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  POST  |  /videos/#{videoId}/categories | category_id | `201 Created`: Resource created, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `409 conflict`: Resource already exist, `500 Internal server error`: Error happened on the server side. |



### Example request
#### _Url_
**POST** `http://api.annotationstool.com/v1/videos/123/categories?category_id=23`
#### _Content_
EMPTY
### Response content
Location parameter in header give the URI from the new resource. 

```javascript
{
 id: 24,
 name: 'Feelings', 
 description: 'Category containing the feelings visible in the video',
 scale_id: 12,
 access: 0,
 updated_by: 123,
 updated_at: 32421434,
 created_by: 123,
 created_at: 32421434, 
}
```

## Get a category<a name="get"/>

Get a category with the id _categoryId_ 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  |  /videos/#{videoId}/categories/#{categoryId} or /categories/#{categoryId} | NONE | `200 Ok`: Resource returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side.|

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1/videos/123/categories/23`
#### _Content_
NO CONTENT
### Response content
```javascript
{
 id: 23,
 name: 'Feelings', 
 description: 'Category containing the feelings visible in the video',
 scale_id: 12,
 access: 0,
 updated_by: 123,
 updated_at: 32421434,
 created_by: 123,
 created_at: 32421434 
}
```

## Get all categories from a video<a name="getAll"/>

Query categories from a video. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  |  /videos/#{videoId}/categories or /categories | [list queries parameters](rest-api.md#wiki-listparam)  | `200 Ok`: Resources returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Default sorting 

By default, the categories list should be sorted by name. 

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1/videos/123/categories?limit=2&offset=0` 
#### _Content_
NO CONTENT
### Response content
```javascript
{
 count: 2, // Result lenght
 offset: 0, // Offset parameter to use in case of pagination needs
 items: [
    {
        id: 23,
 		name: 'Feelings', 
 		description: 'Category containing the feelings visible in the video',
 		scale_id: 12,
 		access: 0,
 		updated_by: 123,
 		updated_at: 32421434,
 		created_by: 123,
 		created_at: 32421434 
 	 },
 	…
 ]
}
```

## Update an category<a name="update"/>

Update the category with the given _categoryId_ or create a new one with this _categoryId_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  PUT  | /videos/#{videoId}/categories/#{categoryId} or /categories/#{categoryId} | NONE  | `200 Ok`: Resource modified, `201 created`: Resource created, `304 Not Modified` : Resource not modified, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### FORM Parameters

### Example request
#### _Url_
**PUT** `http://api.annotationstool.com/v1/videos/123/categories/23` 
#### _Content_
Send the resource parameters as query parameters.

`name=Users+Feelings&description=Category+containing+the+feelings+visible+in+the+video&scale_id=5`

### Response content
Return the status code corresponding the operation done and the Location in the header if resource created.

```javascript
{
 id: 23,
 name: 'Feelings', 
 description: 'Category containing the feelings visible in the video',
 scale_id: 4,
 access: 1,
 updated_by: 123,
 updated_at: 32423412,
 created_by: 123,
 created_at: 32421410, 
}
```

## Delete a category<a name="delete"/>
| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  DELETE  | /videos/#{videoId}/categories/#{categoryId} or /categories/#{categoryId} | NONE | `204 No content`: Resource deleted, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found. |

### Example request
#### _Url_
**DELETE** `http://api.annotationstool.com/v1/videos/123/categories/23` 
#### _Content_
NO CONTENT
### Response content
NO CONTENT

[< Rest API documentation](Rest-API.md)
[1]: rest-get-parameters

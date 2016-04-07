#Annotation

[< Rest API documentation](Rest-API)

### Base URI

`/videos/#{videoId}/track/#{trackId}/annotations`

### Attributes

| Name | Type | Description | Default |
| ------ | ------ | ----- | ----- | -----: |
| id[\*](#required)  |  `Long` | The annotation id. | Generated at creation |
| text  |  `String` | The annotation text. Allows free text annotation. | EMPTY |
| start[\*](#required)  |  `Decimal` | The annotation entry timepoint in seconds. | 0.0 |
| duration | `Decimal` | Duration of the annotation in seconds. | 0.0 | 
| settings | `String` | String of diverse metadata related to the annotation | NULL |
| tags | `String` | String of related tags. | NULL |
| _**+**_  | [logging attributes](rest-api#wiki-logging)|

<a name="required">* = required</a>

An annotation can also contain a label. It had been decided that when a user chose a label for his annotation, the label would be entirely copied into the annotation and not simply added with a reference. The goal is to not report changes done on a label to already created annotation. It is the same case for the scale value. So if an annotation contains a label or a scale value it would have one of the following fields:

the scalevalue object also includes its scale.
the label object also includes its category. 

scalevalue:

```javascript
   {
     id: 12,
     name: 'Extraordinary', 
     value: 10,
     order: 10
     scale: {
       id: 2,
       name: 'Work quality', 
       description: 'Scale to define the quality of the work presented.'
     }
  }
```
dito label -> category

| Name | Type | Description | Default |
| ------ | ------ | ----- | ----- | -----: |
| label  |  [`label json object or label_id`](rest-label) | A JSON representation of the label or a label id for annotation creation operation. | NULL |
| scalevalue  |  [`scalevalue json object or scalevalue_id`](rest-scalevalue) | A JSON representation of the scale value or a scale value id for annotation creation operation. | NULL |

### Access / visibility 

The annotations inherit the access value from their track. It means if the track is set to be visible to everybody, all the annotations on this track will be also be public.

### Operations 

*  **[Add a new annotation to a track](#create)**
*  **[Get an annotation](#get)**
*  **[Get all annotations from track/video](#getAll)**
*  **[Update an annotation](#update)**
*  **[Delete an annotation](#delete)**

## Add a new annotation to a track<a name="create"/>

Add the given track to the track with id _trackId_. The annotation id must not be given . Anyway it will be overwritten. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  POST  |  /videos/#{videoId}/track/#{trackId}/annotations | NONE | `201 Created`: Resource created, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `409 conflict`: Resource already exist, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**POST** `http://api.annotationstool.com/v1/videos/123/track/12/annotations`
#### _Content_
`text=Look+at+the+monkey+in+the+corner&start=12.6&duration=3.4&access=0&label=32`
#### _Response content_
Location parameter in header give the URI from the new resource. 

```javascript
{
 id: 1,
 text: 'Look at the monkey in the corner!', 
 start: 12.6,
 duration: 3.4,
 access: 0,
 updated_by: 123,
 updated_at: 32421410,
 created_by: 123,
 created_at: 32421410, 
 settings: ''
}
```

## Get a track annotation<a name="get"/>

Get a track annotation with the id _annotationId_ 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  |  /videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId} | NONE | `200 Ok`: Resource returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1/videos/123/track/12/annotations/1`

#### _Response content_
```javascript
{
 id: 1,
 text: 'Look at the monkey in the corner!', 
 start: 12.6,
 duration: 3.4,
 access: 0,
 updated_by: 123,
 updated_at: 32421410,
 created_by: 123,
 created_at: 32421410, 
 settings: ''
}
```

## Get all annotation from a track/video<a name="getAll"/>

Query annotation from a track or video.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  |  /videos/#{videoId}/tracks/#{trackId}/annotations or <br/> /videos/#{videoId}/annotations/#{annotationId}| [list queries parameters](rest-api#wiki-listparam) | `200 Ok`: Resources returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found (#{videoId} or #{trackId} does not exist), `500 Internal server error`: Error happened on the server side. |

### Default sorting 

By default, the annotations list should be sorted by start time. 

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/videos/123/tracks/12/annotations?limit=2&offset=0` to get annotations (maximum 2) from track 12 on video 123

**GET** `http://api.annotationstool.com/videos/annotations?limit=2&offset=0` to get annotations (maximum 2) from video 123 (do not care about the track)
#### _Content_
NO CONTENT
#### _Response content_
```javascript
{
 count: 2, // Result length Sprint 2 needed?
 offset: 0, // Offset parameter to use in case of pagination needs Sprint 2 needed?
 annotations: [
    {
        id: 1,
        text: 'Look at the monkey in the corner!', 
        start: 12.6,
        duration: 3.4,
        access: 1,
        updated_by: 123,
 		updated_at: 32421410,
 		created_by: 123,
 		created_at: 32421410, 
        settings: ''
    },
    {
        // Example of free text annotation
        id: 2,
        text: 'The soundtrack is "We own the sky" from M83', 
        start: 21.6,
        duration: 102.4,
        access: 1,
        updated_by: 123,
 		updated_at: 32421415,
 		created_by: 123,
 		created_at: 32421415, 
    }
 ]
}
```

## Update an annotation<a name="update"/>

Update the annotation with the given _annotationId_ or create a new one with this _annotationId_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  PUT  |  /videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId}  | NONE  | `200 Ok`: Resource modified, `201 created`: Resource created, `304 Not Modified` : Resource not modified, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side.|

### Example request
#### _Url_
**PUT** `http://api.annotationstool.com/v1/videos/123/tracks/12/annotations/1`
#### _Content_
Send the resource parameters as query parameters.

`text=Look+at+the+monkey+in+the+corner&start=12.6&duration=3.4&access=1&label=56`

#### _Response content_
Return the status code corresponding the operation done and the Location in the header if resource created.

```javascript
{
 id: 1,
 text: 'Look at the monkey in the corner!', 
 start: 12.6,
 duration: 3.4,
 access: 1,
 label: 56,
 updated_by: 123,
 updated_at: 32423412,
 created_by: 123,
 created_at: 32421410, 
}
```

## Delete a annotation<a name="delete"/>
| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  DELETE  |  /videos/#{videoId}/tracks/#{trackId}/annotations/#{annotationId} | NONE | `200 Ok`: Resource deleted, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found. |

### Example request
#### _Url_
**DELETE** `http://api.annotationstool.com/v1/videos/123/tracks/12/annotations/1`
#### _Content_
NO CONTENT
#### _Response content_
NO CONTENT

[< Rest API documentation](Rest-API)
[1]: rest-get-parameters
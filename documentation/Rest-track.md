# Track 

[< Rest API documentation](Rest-API)

The track resources are related to a video.

### Base URI

`http://api.annotationstool.com/v1/videos/#{videoId}/tracks`

### Attributes

| Name | Type | Description | Default |
| ------ | ----- | ----- | -----: |
|id [\*](#required)  |  `Long` | The track id. | Generated at creation |
|name[\*](#required)   |  `String` | The track name. | EMPTY |
|description  |  `String` | The track description. | EMPTY |
|settings | `String` | List of track settings, not well defined at the moment. | NULL |
| tags | `String` | String of related tags. | NULL |
| _**+**_  | [logging attributes](rest-api#wiki-logging)|

<a name="required">* = required</a>

### Operations 

*  **[Add a new track to a video](#create)**
*  **[Get a track](#get)**
*  **[Get all tracks from video](#getAll)**
*  **[Update a track](#update)**
*  **[Delete a track](#delete)**

## Add a new track to a video<a name="create"/>

Add the given track to the video with id _videoId_. The track id must not be given . Anyway it will be overwritten. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  POST  |  /videos/#{videoId}/tracks | NONE | `201 Created`: Resource created, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**POST** `http://api.annotationstool.com/v1/videos/123/tracks`
#### _Content_
`name=example+track&description=simple+track&settings={color:blue,picture=http%3A%2F%2Ficon.org%2FmyTrackIcon.png}&access=1`

#### _Response content_
Location parameter in header give the URI from the new resource. 

```javascript
{
 id: 1,
 name: 'example track', 
 description: 'Simple track to add some basic annotations',
 settings: '{
    // Some possible settings, not well defined at the moment 
    color: \"blue\",
    picture: \"http://icon.org/myTrackIcon.png\"
 }',
 access: 1
 updated_by: 123,
 updated_at: 32421410,
 created_by: 123,
 created_at: 32421410 
}
```

## Get a video track<a name="get"/>

Get a video track with the id _trackId_ 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  |  /videos/#{videoId}/tracks/#{trackId} | NONE | `200 Ok`: Resource returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/videos/123/tracks/1`
#### _Content_
NO CONTENT
#### _Response content_
```javascript
{
 id: 1,
 name: 'example track', 
 description: 'Simple track to add some basic annotations',
 settings: '{
    // Some possible settings, not well defined at the moment 
    color: \"blue\",
    picture: \"http://icon.org/myTrackIcon.png\"
 }',
 access: 1,
 updated_by: 123,
 updated_at: 32421410,
 created_by: 123,
 created_at: 32421410 
}
```

## Get all tracks from a video<a name="getAll"/>

Query tracks from a video. 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  |  /videos/#{videoId}/tracks | [list queries parameters](rest-api#wiki-listparam) <img src="images/sprint1.png"/> | `200 Ok`: Resources returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found (#{videoId} does not exist), `500 Internal server error`: Error happened on the server side. |

### Default sorting 

By default, the tracks list should be sorted by name. 

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/videos/123/tracks?limit=2`
#### _Content_
NO CONTENT
#### _Response content_
```javascript
{
 count: 2, // Result length SPRINT 2 needed?
 offset: 0, // Offset parameter to use in case of pagination needs SPRINT 2 needed?
 tracks: [ 
    { 
        id: 1,
        name: 'example track', 
        description: 'Simple track to add some basic annotations',
        settings: {
          color: 'blue',
          picture: 'http://icon.org/myTrackIcon.png'
        },
        access: 'public'
    },
    {
        id: 2,
        name: 'George private track', 
        description: 'The private track from George',
        settings: {
          color: 'red',
          picture: 'http://icon.org/anotherIcon.png'
        },
        access: 0,
        updated_by: 123,
 		updated_at: 32421410,
 		created_by: 123,
 		created_at: 32421410 
    }
 ]
}
```

## Update a track<a name="update"/>

Update the track with the given _trackId_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  PUT  |  /videos/#{videoId}/tracks/#{trackId} | NONE  | `200 Ok`: Resource modified, `304 Not Modified` : Resource not modified, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**PUT** `http://api.annotationstool.com/v1/videos/123/tracks/1`
#### _Content_
Send the resource parameters as query parameters.

`name=example+track&description=simple+track&settings={color:blue,picture=http%3A%2F%2Ficon.org%2FmyTrackIcon.png}&access=1`

#### _Response content_
Return the status code corresponding the operation done and the Location in the header if resource created.

```javascript
{
 id: 1,
 name: 'example track', 
 description: 'Simple track',
 settings: '{
    // Some possible settings, not well defined at the moment 
    color: "blue",
    picture: "http://icon.org/myTrackIcon.png"
 }',
 access: 1,
 updated_by: 123,
 updated_at: 32423432,
 created_by: 123,
 created_at: 32421410 
}
```

## Delete a track<a name="delete"/>
| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  DELETE  |  /videos/#{videoId}/tracks/#{trackId} | NONE | `204 No content`: Resource deleted, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found. |

### Example request
#### _Url_
**DELETE** `http://api.annotationstool.com/v1/videos/123/tracks/1`
#### _Content_
NO CONTENT
#### _Response content_
NO CONTENT

[< Rest API documentation](Rest-API)
[1]: rest-get-parameters
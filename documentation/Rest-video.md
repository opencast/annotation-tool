# Video

[< Rest API documentation](Rest-API.md)


The video is the root resources. It is a representation of the video element from the video portal/system (i.e. Opencast Matterhorn) for the annotation tool. 

### Base URI

`http://api.annotationstool.com/v1/videos`

### Attributes

| Name | Type | Description | Default | 
| ------- | ------ | ----- | ----- |
| id[\*](#required)   |  `Long` | The video id for the annotations tool. | Generated at creation |
| video_extid[\*](#required) |  `String` | The video id for the used video portal/system (i.e. Opencast Matterhorn). This id will be used by the annotations tool to control/communicate with the player through a player adapter. | 0 |
| tags | `String` | String of related tags. | NULL |
| _**+**_  | [logging attributes](rest-api#wiki-logging)|

<a name="required">* = required</a>

### Operations

*  **[Get a video](#video_get)**
*  **[Update or create a video](#video_update)**
*  **[Delete a video](#video_delete)**
*  **[Export video information for statistics usage](#video_export)**

## Get a video<a name="video_get"/>

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  |  /videos/#{id} | NONE | `200 Ok`: Resource returned, `404 Not found`: Resource not found |

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1/videos/123`
#### _Content_
NO CONTENT
#### _Response content_
```javascript 
{
	'id': 123, 
	'video_extid': 'video15Matterhorn'
}
```


## Update or create a video<a name="video_update"/>
Update the video with the given _video_extid_ or create a new one with this _video_extid_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  PUT  |  /videos/ | video_extid, tags | `200 Ok`: Resource modified, `201 created`: Resource created. |

### Example request
#### _Url_
**PUT** `http://api.annotationstool.com/v1/videos`
#### _Content_
`video_extid=video15Matterhon&tags=[{'channel_id':'1234'}]`

#### _Response content_
```javascript 
{
	'id': 123, 
	'video_extid': 'video15Matterhorn',
        'tags': [{'channel_id':'1234'}]
}
```

#### _Response Header_
LOCATION (url to the created / updated resource) Required for creation AND update!!!

##  Delete a video<a name="video_delete"/>

staubesv, 9-18-2012
* Semantics not yet defined

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  DELETE  |  /videos/#{id} | NONE | `200 OK`: Resource deleted, `404 Not found`: Resource not found.|

### Example request
#### _Url_
**DELETED** `http://api.annotationstool.com/v1/videos/23`
#### _Content_
NO CONTENT
#### _Response content_
NO CONTENT


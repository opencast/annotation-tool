# User

[< Rest API documentation](Rest-API.md)

The user resources is used to make the binding between the annotations tool context (i.e. ilias or sakai) and the annotation tools itself for the users management. 

### Base URI

`http://api.annotationstool.com/v1/users`

### Attributes
| Name | Type | Description | Default |
| ------ | ----- | ----- | -----: |
| id[\*](#required)   |  `Long` | The user id for the annotation tool. | Generated at creation |
| user_extid[\*](#required)   |  `String` | The user id for the used video portal/system (i.e. Opencast Matterhorn). This id will be used by the annotations tool to make the binding with the user from the current context. | EMPTY |
| nickname[\*](#required)   |  `String` | The user nickname. | EMPTY |
| email | `String` | User email address. | NULL |
| _**+**_  | [logging attributes](rest-api#wiki-logging)|

<a name="required">* = required</a>


### Operations 
*  **[Update or create a user](#update)**
*  **[Create a new user](#create)**
*  **[Get a user](#get)**
*  **[Delete a user](#delete)** 

## Update or create a user<a name="update"/>

Update the user with the given _user_extid_ or create a new one with this _user_extid_.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  PUT  |  /users/ | user_extid, email, nickname  | `200 Ok`: Resource modified, `201 created`: Resource created. |


### Example Request
#### _Url_
**PUT** `http://api.annotationstool.com/v1/users/`
#### _Content_
user_extid=R2D2&nickname=RobotsKing&email=r2d2@empire.org
#### _Response Content_
```javascript
{
 id: 1,
 user_extid: 'R2D2', 
 nickname: 'RobotsKing',
 email: 'r2d2@empire.org'
}
```

#### _Response Header_
X-ANNOTATIONS-USER-AUTH-TOKEN
X-ANNOTATIONS-USER-USER-ID
LOCATION (url to the created / updated resource) **Required for creation AND update!!!**


## Create a new user<a name="create"/>

Create a user. Email, Nickname are **not** enforced unique.

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  POST  |  /users | NONE | `201 Created`: Resource created, `400 Bad request`: Request not valid, `401 Unauthorized`: Operation not authorized for the user, `409 conflict`: Resource already exist, `500 Internal server error`: Error happened on the server side. |



### Example request
#### _Url_
**POST** `http://api.annotationstool.com/v1/users`
#### _Content_
`id=1&user_extid=R2D2&nickname=RobotsKing&email=r2d2@rebelalliance.org`
#### _Response content_
Location parameter in header give the URI from the new resource. 

```javascript
{
 id: 1,
 user_extid: 'R2D2', 
 nickname: 'RobotsKing',
 email: 'r2d2@rebelalliance.org'
}
```

## Get a user<a name="get"/>

_**NO MORE USED**_

staubesv, 09-18-2012: 
* The request GET /users/:id is only allowed if it is sent by the (logged-in) user :id. This restriction makes it impossible to enumerate all other users from the database and gain access to their private data (e.g. e-mail address)
* It is not yet clear whether we need this request at all (the logged-in user always executes a update_or_create_user request and therefore is aware of its own data)

Get a user 

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  GET  |  /users/:id | NONE | `200 Ok`: Resource returned, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found, `500 Internal server error`: Error happened on the server side. |

### Example request
#### _Url_
**GET** `http://api.annotationstool.com/v1/users/1`
#### _Content_
NO CONTENT
#### _Response content_
```javascript
{
 id: 1,
 user_extid: 'R2D2', 
 nickname: 'RobotsKing',
 email: 'r2d2@rebelalliance.org'
}
```

## Delete a user<a name="delete"/>

Delete the user with the given _id_. 
**Only the logged-in user :id can execute DELETE /users/:id**.

staubesv, 09-18-2012:
* Semantic of deletion to be defined

| Method | Path | Parameters | HTTP Response |
| ------ | ------ | ----- | -----: |
|  DELETE  |  /users/:id | NONE | `204 No content`: Resource deleted, `401 Unauthorized`: Operation not authorized for the user, `404 Not found`: Resource not found. |

### Example request
#### _Url_
**DELETE** `http://api.annotationstool.com/v1/users/1`
#### _Content_
NO CONTENT
#### _Response content_
NO CONTENT

[< Rest API documentation](Rest-API.md)
[1]: rest-get-parameters

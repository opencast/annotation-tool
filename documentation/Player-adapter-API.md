# Player adapter API

The player adapter is the proxy between the player and the annotations tool. In theory all kind of web player could be used with the annotations tool. It requires only the implementation of a player adapter with the following API (currently a proposal, comments are welcome).

**No load method are present here because it should be done in the player adapter constructor.**

## Methods
| Signature | Parameter | Return  | Description |
| ------ | ------ | ----- | ----- |
|  play() |  | | Play the media. |
|  pause() |   | | Set the media in pause.|
|  setCurrentTime(Double time) |  `Double`, time in seconds | | Modify the media current time. |
|  getCurrentTime() |   | `Double`, time in seconds | Get the media current time. |
|  getDuration() |   | `Double`, time in seconds | Get the media duration. |
|  getStatus() |   | [`Player status`](#status) | Get the current player status. |




## Events

All these events have to be triggered by the player adapter implementation. 

| Name | Triggered when...|
| ------ | -----: |
|  pa_play | the video status change to play. |
|  pa_pause | the video status change to pause. |
|  pa_seeking | the video status change to seeking. |
|  pa_ready |  the video is ready to play. It means also the duration is known.  |
|  pa_timeupdate |  the video is playing, each 100ms (to be close to HTML5 implementation). |
|  pa_error | an error append on the player side. |
|  Pa_ended | the video is finished. |

## Status<a name="status"></a>
Possible status:

1. INITIALIZING
* PLAYING
* PAUSED
* ENDED
* ERROR_NETWORK
* ERROR_UNSUPPORTED_MEDIA
* ERROR_UNAUTHORIZED_ACCESS
* LOADING
* SEEKING

## Implementation

Each implementation of the player adapter must include the [player adapter prototype](https://github.com/entwinemedia/annotations/blob/develop/js/prototypes/player_adapter.js) as prototype. The [HTML5 player adapter](https://github.com/entwinemedia/annotations/blob/develop/js/player_adapter_HTML5.js) is a good example of an implementation and its [unit tests](https://github.com/entwinemedia/annotations/blob/develop/tests/HTM5_adapter.html) can be easily modified to test your own player adapter.  

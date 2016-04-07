`200	OK	:ok` - If the command passed was successfully executed (delete or update or find etc.)

`201	Created	:created` - If resource was created

`304	Not modified: not_modified`- If the ressource has not been modified since the last request 

`400	Bad Request	:bad_request` - The server thinks the client made a mistake (wrong parameter count, etc.)

`401	Unauthorized	:unauthorized` - Not authorized or no user header given

`403	Forbidden	:forbidden` - Not implemented, not available

`404	Not Found	:not_found` - Nothing found with this id etc.

`500	Exception	:internal_server_error` - A major unexpected Error.
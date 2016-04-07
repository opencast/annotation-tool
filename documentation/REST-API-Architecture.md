# Architecture REST-API

## ressource-centric approach

1. Define your resources and fields e.g. User, user_id:string, email:string, nickname:string
1. Create the model on client (js) and server (rest) 
1. Create a server side controller for all CRUD actions.
1. Sync the objects between client and server (<=>)
1. A lot of logic will happen on the client.

### +
* Easy client side MVC framework integration 
* Very small server
* Very little logic server side

### -
* Security (allow all, disallow some for CRUD actions / all data instead of scoped)
* A lot of requests (e.g. to update a record search the id, get an element, update the element, resync)
* If you have many model objects, sometimes slow because you tend to retrieve to many objects

### Use Cases

* Mobile apps with server side representation (e.g. 37Signals mobile client)
* Rich interfaces with small datasets

## method-centric approach

1. define the thing you want to do, e.g. 'As an API-client I order to init a session I want to find the user by user_id, update email, nickname or create the user if it doesn't exist'
2. Write the documentation / test (desc, params)
3. Create an api-server method
<pre>
  desc "Find an exisiting or create user, return (STATUS 200 if OK, STATUS 500 if fails) {'current_user': [db id of user]} ", {
    params: 
      { 
        user_id:  { desc: "User user_id",   type: "string" },
        email:    { desc: "Email address",  type: "string" },
        nickname: { desc: "Displayed Name", type: "string" }
      }
  }
  resource :users do
    post '/' do
      
      @current_user = User.update_or_create_by_uid(
        params[:user_id], 
        :email => params[:email],  
        :nickname => params[:nickname]
      )
      if @current_user.valid?
        status 200
        {"current_user" => @current_user.id }
      else
        error!({ "error" => "fails to create valid user", "detail" => "user: #{@current_user.inspect}" }, 500)
      end
    end
  end
</pre>

4. Clientside you do something like

<pre>
    post "/api/v1/users/", {
        :user_id => "222", 
        :email => "me@you.com",
        :nickname => "new name"
      }
      if response.status == 200
        current_user = JSON.parse(response.body)
      else
        ...
</pre>

### +
* Fewer requests
* Less data transfer
* Smaller API method set 

### -
* Needs an client side adapter / proxy to fill models
* More complex to understand
* Needs more documentation

### Use Cases
* Applications like Twitter with large datasets
* Applications like Facebook with protected datasets

## some other thoughts

We could also use a library, which is designed for rails / backbone.js

* https://github.com/meleyal/backbone-on-rails
* https://github.com/codebrew/backbone-rails

At the moment I use Rails and Grape

* https://github.com/intridea/grape

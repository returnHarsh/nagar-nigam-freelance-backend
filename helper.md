admin js hooks 

new.before -> this is triggered when any doc created for the first time , and this hook is called before making the changes in DB , so that you can modify the doc to change in DB  
here you recieve => (request , context) -> in request you have the whole doc value inside request.payload;

new.after -> this is triggerd when the changes are made in DB
here you recieve => (response , request , context) -> response.record.params(here you get the original changed document that is stored in DB) , and on the request you also gets the similar doc as of inside request.payload

edit.before -> this trigger before the edit doc save in DB , 
edit.after -> this trigger after the doc is saved in DB,
** note : but the thing in here is when you click the edit button , both before and after already ran 1 time , so to prevent your logic also being trigger you have to monitor the request.payload if it comes empty then the user havn't clicked on submit button..
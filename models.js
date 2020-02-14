var User = function(id, name){
    if(arguments.length < 2 ) return new Error('Not enough args!');
return {id: id, user: name};
}


exports.user = User;
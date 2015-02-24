var mongodb = require('./db');

function User(user){  //param -> json  name psw email
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

module.exports = User;

User.prototype.save = function(callback){
	//要存入的信息
	var user = {
		name:this.name,
		password:this.password,
		email:this.email
	}

	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		db.collection('users',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.insert(user,{safe:true},function(err,user){
				mongodb.close();
				if(err){
					return callback(err);
				}
				console.log(user[0]);
				callback(null,user[0]);   // err 返回null  并返回存储的用户文档
			});
		});
	});
};

//根据name读取用户信息
User.get = function(name,callback){
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		db.collection('users',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				name:name
			},function(err,user){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,user);
			});
		});
	});
};



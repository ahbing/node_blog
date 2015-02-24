var mongodb = require('./db'),//链接数据库
	markdown = require('markdown').markdown; 

function Post(name,title,tags,post){
	this.name = name;
	this.title = title;
	this.tags = tags;
	this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback){
	var date = new Date();
	var time = {
		date:date,
		year:date.getFullYear(),
		month:date.getFullYear()+'-'+(date.getMonth()+1),
		day:date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
		minute:date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'-'
			+date.getHours()+':'+(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())
	}
	var post ={
		name:this.name,
		title:this.title,
		time:time,
		tags:this.tags,
		post:this.post,
		comments:[],
		pv:0
	}
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.insert(post,{safe:true},function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});

};
//  传入参数name 就回去name的所有文章  不传参数 就返回所有人的所有文章
Post.getTen = function(name,page,callback){  //name是作者的名字
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var query ={};
			if(name){
				query.name = name;
			}/*
			collection.find(query).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				//将markdown格式转化为html
				docs.forEach(function(doc){
					doc.post = markdown.toHTML(doc.post);	
				});
				callback(null,docs);   //将查询结果以数组的形式全部返回
			});*/
			collection.count(query,function(err,total){
				collection.find(query,{
					skip:(page-1)*10,
					limit:10
				}).sort({
					time:-1
				}).toArray(function(err,docs){
					mongodb.close();
					if(err){
						return callback(err);
					}
					docs.forEach(function(doc){
						doc.post = markdown.toHTML(doc.post);
					});

					callback(null,docs,total);
				});
			});
		});
	});
};

Post.getOne = function(name,day,title,callback){
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			},function(err,doc){
				if(err){
					return callback(err);
				}
				if(doc){
					collection.update({
						"name":name,
						"time.day":day,
						"title":title
					},{
						$inc:{"pv":1}
					},function(err){
						mongodb.close();
						if(err){
							return callback(err);
						}
					});		
					//现将其解析成html
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function(comment){
						comment.content = markdown.toHTML(comment.content);
					});
					callback(null,doc);   //将查找到的文章返回
				}
			});
		});
	});
};

Post.edit = function(name,day,title,callback){
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			},function(err,doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,doc);
			});
		});
	});
};


Post.update = function(name,day,title,post,callback){
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.update({
				"name":name,
				"time.day":day,
				"title":title
			},{$set:{post:post}},function(err){ //更新文章内容
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

Post.remove = function(name,day,title,callback){
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.remove({
				'name':name,
				'time.day':day,
				'title':title
			},{
				w:1  //删除一篇文章
			},function(err){
				mongodb.close();
				if(err){
					callback(err);
				}
				callback(null);
			});
		});
	});
};

Post.getArchive = function(callback){
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.find({},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};
Post.getTags = function(callback){
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//distinct 用来找出给定键的所有不同值
			//获取tags数组中不同的值  array
			collection.distinct('tags',function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			})
		});
	});
};
Post.getTag = function(tag,callback){
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.find({
				"tags":tag	
			},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};
Post.search = function(keyword,callback){
	mongodb.open(function(err,db){
		if(err){
			mongodb.close();
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			var pattern = new RegExp(keyword,'i');
			collection.find({
				"title":pattern
			},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};

















var crypto = require('crypto'),
	User = require('../models/user.js'),
	Post = require('../models/post.js'),
	Comment = require('../models/comment.js');


module.exports = function(app){
	app.get('/',function(req,res){
		var page = req.query.p ? parseInt(req.query.p):1;
		Post.getTen(null,page,function(err,posts,total){
			if(err){
				posts =[];
			}
			res.render('index',{
				title:'主页',
				user:req.session.user,
				posts:posts,
				total:total,
				page:page,
				isFirstPage:(page - 1) == 0,
				isLastPage:((page - 1) * 10 + posts.length) == total,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});	
	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res){
		res.render('reg',{
			title:'注册',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});	
	app.post('/reg',function(req,res){
		var name =req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'],
			email = req.body.email;
		if(password!==password_re){
			req.flash('error','两次密码输入不一样');
			return res.redirect('/reg');
		}
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');

		var newUser = new User({
			name:name,
			password:password,
			email:email
		});

		// 实例化之后可以使用User 的方法
		//检查用户名是否已经存在
		User.get(newUser.name,function(err,user){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			if(user){
				req.flash('error','用户名已经存在');
				return res.redirect('/reg');
			}
			//如果用户名不存在的话，就增加新的用户

			newUser.save(function(err,user){
				if(err){
					req.flash('error',err);
					return res.redirect('/');
				}
				//将用户信息存入session
				req.session.user = user;
				req.flash('success','注册成功');
				return res.redirect('/');
			});

		});
	});

	app.get('/login',checkNotLogin);
	app.get('/login',function(req,res){
		res.render('login',{
			title:'主页',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/login',function(req,res){
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		User.get(req.body.name,function(err,user){
			if(!user){
				req.flash('error','用户名不存在');
				return res.redirect('/login');
			}
			if(user.password!==password){
				req.flash('error','密码不正确');
				return redirect('/login');
			}
			req.session.user = user;
			req.flash('success','登录成功');
			return res.redirect('/');  //登录成功后 跳转主页
		});
	});

	app.get('/logout',checkLogin);
	app.get('/logout',function(req,res){
		req.session.user = null;
		req.flash('success','退出成功');
		return res.redirect('/');
	});

	app.get('/post',checkLogin);
	app.get('/post',function(req,res){
		res.render('post',{
			title:'发表',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});

	app.post('/post',function(req,res){
		var currrenUser = req.session.user,
		tags = [req.body.tag1, req.body.tag2, req.body.tag3],
		post = new Post(currrenUser.name,req.body.title,tags,req.body.post);

		post.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','发表成功');
			return res.redirect('/');   //跳转到主页
		});
	});

	app.get('/upload',checkLogin);
	app.get('/upload',function(req,res){
		res.render('upload',{
			title:'上传',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		})
	});

	app.post('/upload',checkLogin);
	app.post('/upload',function(req,res){
		req.flash('success','上传成功'),
		res.redirect('/upload');
	});

	app.get('/archive',function(req,res){
		Post.getArchive(function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('archive',{
				title:"存档",
				user:req.session.user,
				posts:posts,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});

	app.get('/tags',function(req,res){
		Post.getTags(function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tags',{
				title:"标签",
				posts:posts,   //数组形式的全部tags
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});

	app.get('/search',function(req,res){
		Post.search(req.query.keyword,function(err,posts){
			if(err){
				req.flash('error').toString();
				return res.redirect('/');
			}

			res.render('search',{
				title:'SEARCH:'+req.query.keyword,
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	app.get('/links',function(req,res){
		res.render('links',{
			title:'友情链接',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.get('/tags/:tag',function(req,res){
		Post.getTag(req.params.tag,function(err,posts){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('tag',{
				title:"TAG:"+req.params.tag,
				posts:posts,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});

	//返回name的文章  没有param 就返回所有文章
	app.get('/u/:name',function(req,res){
		var page = req.query.p ? parseInt(req.query.p):1;
		User.get(req.params.name,function(err,user){
			if(!user){
				req.flash('error','用户不存在');
				return res.redirect('/');  
			}

			Post.getTen(user.name,page,function(err,posts,total){
				if(err){
					req.flash('error',err);
					return res.redirect('/');
				}
				res.render('user',{
					title:user.name,
					posts:posts,
					page:page,
					isFirstPage:(page - 1) == 0,
					isLastPage:((page-1) * 10 +posts.length) == total,
					user:req.session.user,
					success:req.flash('success').toString(),
					error:req.flash('error').toString()
				});
			});
		});
	});

	app.get('/u/:name/:day/:title', function(req,res){
		Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('article',{
				title:req.params.title,
				post:post,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	//评论
	app.post('/u/:name/:day/:title',function(req,res){
		var date = new Date();
		var time = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'-'+
					date.getHours()+':'+(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes());
	
		var comment = {
			name:req.body.name,
			email:req.body.email,
			website:req.body.website,
			time:time,
			content:req.body.content
		}
		var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
		newComment.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','留言成功');
			return res.redirect('back');
		});
	});



	app.get('/edit/:name/:day/:title',checkLogin);
	app.get('/edit/:name/:day/:title',function(req,res){
		var currentUser = req.session.user;
		Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
			if(err){
				req.flash('error',err);
				return res.redirect('back');
			}
			res.render('edit',{
				title:"编辑",
				post:post,   //存在数据库中的本来就是markdown
				user:req.session.user, //当前登录的user
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});

	//提交编辑之后的内容
	app.post('/edit/:name/:day/:title',checkLogin);
	app.post('/edit/:name/:day/:title',function(req,res){
		var currentUser = req.params.name;
		//作者 标题  tags不能更改 只能修改文章
		Post.update(currentUser,req.params.day,req.params.title,req.body.post,function(err){
			var url =encodeURI('/u/'+req.params.name+'/'+req.params.day+'/'+req.params.title); 
			if(err){
				req.flash('error',err);
				return res.redirect(url);
			}
			req.flash('success','修改成功');
			return res.redirect(url);
		});
	});

	app.get('/remove/:name/:day/:title',checkLogin);
	app.get('/remove/:name/:day/:title',function(req,res){
		Post.remove(req.params.name,req.params.day,req.params.title,function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','删除成功');
			return res.redirect('/'); 

		});
	});


};
	


function checkLogin(req,res,next){
	if(!req.session.user){//没有登录
		req.flash('error','未登录');
		return res.redirect('/login');
	}
	next();
}

function checkNotLogin(req,res,next){
	if(req.session.user){
		req.flash('error','已登录');
		return res.redirect('back');
	}
	next();
}
var game = new Phaser.Game(320,505,Phaser.AUTO,'game'); //实例化game
game.States = {}; //存放state对象

game.States.boot = function(){
	this.preload = function(){
		if(!game.device.desktop){//自适应
			this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			this.scale.forcePortrait = true;
			this.scale.refresh();
		}
		game.load.image('loading','assets/preloader.gif');
	};
	this.create = function(){
		game.state.start('preload'); //跳转到资源加载页面
	};
}

game.States.preload = function(){
	this.preload = function(){
		var preloadSprite = game.add.sprite(35,game.height/2,'loading'); //创建显示loading进度的sprite
		game.load.setPreloadSprite(preloadSprite);
		//以下为要加载的资源
		game.load.image('background','assets/background.png'); //背景
    	game.load.image('ground','assets/ground.png'); //地面
    	game.load.image('title','assets/title.png'); //游戏标题
    	game.load.spritesheet('fox','assets/fox.png',35,39,2); //狐狸
    	game.load.image('btn','assets/start-button.png');  //按钮
    	game.load.spritesheet('pipe','assets/pipes.png',54,320,2); //管道
    	game.load.bitmapFont('flappy_font', 'assets/fonts/flappyfont/flappyfont.png', 'assets/fonts/flappyfont/flappyfont.fnt');
    	game.load.audio('fly_sound', 'assets/flap.wav');//飞翔的音效
    	game.load.audio('score_sound', 'assets/score.wav');//得分的音效
    	game.load.audio('hit_pipe_sound', 'assets/pipe-hit.wav'); //撞击管道的音效
    	game.load.audio('hit_ground_sound', 'assets/ouch.wav'); //撞击地面的音效
    	game.load.spritesheet('medals','assets/medals.png',44,44,2);//英超成就奖章

    	game.load.image('ready_text','assets/get-ready.png');
    	game.load.image('play_tip','assets/instructions.png');
    	game.load.image('game_over','assets/gameover.png');
    	game.load.image('score_board','assets/scoreboard.png');
	}
	this.create = function(){
		game.state.start('menu');
	}
}

game.States.menu = function(){
	this.create = function(){
		game.add.tileSprite(0,0,game.width,game.height,'background').autoScroll(-10,0); //背景图
		game.add.tileSprite(0,game.height-112,game.width,112,'ground').autoScroll(-100,0); //地板
		var titleGroup = game.add.group(); //创建存放标题的组
		titleGroup.create(0,0,'title'); //标题
		var fox = titleGroup.create(190, 10, 'fox'); //添加fox到组里
		fox.animations.add('fly'); //添加动画
		fox.animations.play('fly',12,true); //播放动画
		titleGroup.x = 35;
		titleGroup.y = 100;
		game.add.tween(titleGroup).to({ y:120 },1000,null,true,0,Number.MAX_VALUE,true); //标题的缓动动画
		var btn = game.add.button(game.width/2,game.height/2,'btn',function(){//开始按钮
			game.state.start('play');
		});
		btn.anchor.setTo(0.5,0.5);
	}
}

game.States.play = function(){
	this.create = function(){
		this.bg = game.add.tileSprite(0,0,game.width,game.height,'background');//背景图
		this.pipeGroup = game.add.group();
		this.pipeGroup.enableBody = true;
		this.ground = game.add.tileSprite(0,game.height-112,game.width,112,'ground'); //地板
		this.fox = game.add.sprite(50,150,'fox'); //狐狸
		this.fox.animations.add('fly');
		this.fox.animations.play('fly',12,true);
		this.fox.anchor.setTo(0.5, 0.5);
		game.physics.enable(this.fox,Phaser.Physics.ARCADE); //开启狐狸的物理系统
		this.fox.body.gravity.y = 0; //狐狸的重力,未开始游戏，先先让他不动
		game.physics.enable(this.ground,Phaser.Physics.ARCADE);//地面
		this.ground.body.immovable = true; //固定不动

		this.soundFly = game.add.sound('fly_sound');
		this.soundScore = game.add.sound('score_sound');
		this.soundHitPipe = game.add.sound('hit_pipe_sound');
		this.soundHitGround = game.add.sound('hit_ground_sound');
		this.scoreText = game.add.bitmapText(game.world.centerX-20, 30, 'flappy_font', '0', 36);

		this.readyText = game.add.image(game.width/2, 40, 'ready_text'); //get ready 文字
		this.playTip = game.add.image(game.width/2,300,'play_tip'); //提示点击
		this.readyText.anchor.setTo(0.5, 0);
		this.playTip.anchor.setTo(0.5, 0);

		this.hasStarted = false; //游戏是否已开始
		game.time.events.loop(900, this.generatePipes, this);
		game.time.events.stop(false);
		game.input.onDown.addOnce(this.statrGame, this);
	};
	this.update = function(){
		if(!this.hasStarted) return; //游戏未开始
		game.physics.arcade.collide(this.fox,this.ground, this.hitGround, null, this); //与地面碰撞
		game.physics.arcade.overlap(this.fox, this.pipeGroup, this.hitPipe, null, this); //与管道碰撞
		if(this.fox.angle < 90) this.fox.angle += 2.5; //下降时头朝下
		this.pipeGroup.forEachExists(this.checkScore,this); //分数检测和更新
	}

	this.statrGame = function(){
		this.gameSpeed = 200; //游戏速度
		this.gameIsOver = false;
		this.hasHitGround = false;
		this.hasStarted = true;
		this.score = 0;
		this.bg.autoScroll(-(this.gameSpeed/10),0);
		this.ground.autoScroll(-this.gameSpeed,0);
		this.fox.body.gravity.y = 1150; //狐狸的重力
		this.readyText.destroy();
		this.playTip.destroy();
		game.input.onDown.add(this.fly, this);
		game.time.events.start();
	}

	this.stopGame = function(){
		this.bg.stopScroll();
		this.ground.stopScroll();
		this.pipeGroup.forEachExists(function(pipe){
			pipe.body.velocity.x = 0;
		}, this);
		this.fox.animations.stop('fly', 0);
		game.input.onDown.remove(this.fly,this);
		game.time.events.stop(true);
	}

	this.fly = function(){
		this.fox.body.velocity.y = -250;
		game.add.tween(this.fox).to({angle:-30}, 100, null, true, 0, 0, false); //上升时头朝上
		this.soundFly.play();
	}

	this.hitPipe = function(){
		if(this.gameIsOver) return;
		this.soundHitPipe.play();
		this.gameOver();
	}
	this.hitGround = function(){
		if(this.hasHitGround) return; //已经撞击过地面
		this.hasHitGround = true;
		this.soundHitGround.play();
		this.gameOver(true);
	}
	this.gameOver = function(show_text){
		this.gameIsOver = true;
		this.stopGame();
		if(show_text) this.showGameOverText();
	};

	this.showGameOverText = function(){
		this.scoreText.destroy();
		game.bestScore = game.bestScore || 0;
		if(this.score > game.bestScore) game.bestScore = this.score; //最高分
		this.gameOverGroup = game.add.group(); //添加一个组
		var gameOverText = this.gameOverGroup.create(game.width/2,0,'game_over'); //game over 文字图片
		var scoreboard = this.gameOverGroup.create(game.width/2,70,'score_board'); //分数板
		var currentScoreText = game.add.bitmapText(game.width/2 + 60, 105, 'flappy_font', this.score+'', 20, this.gameOverGroup); //当前分数
		var bestScoreText = game.add.bitmapText(game.width/2 + 60, 153, 'flappy_font', game.bestScore+'', 20, this.gameOverGroup); //最高分

		if(this.score > 2) 
			var medalEPL = game.add.sprite(game.width/2-87, 142, 'medals', 0, this.medalGroup);//英超奖章
		if(this.score > 5)
			var medalEL = game.add.sprite(game.width/2-87, 142, 'medals', 1, this.medalGroup);//欧联杯奖章


		//var medalEL = game.add.sprite(game.width, 105, 'medals', 1, this.medalGroup);//欧联杯奖章



		
		var replayBtn = game.add.button(game.width/2, 210, 'btn', function(){//重玩按钮
			game.state.start('play');
		}, this, null, null, null, null, this.gameOverGroup);
		gameOverText.anchor.setTo(0.5, 0);
		scoreboard.anchor.setTo(0.5, 0);
		replayBtn.anchor.setTo(0.5, 0);
		this.gameOverGroup.y = 30;
	}

	this.generatePipes = function(gap){ //制造管道
		gap = gap || 100; //上下管道之间的间隙宽度
		var position = (505 - 320 - gap) + Math.floor((505 - 112 - 30 - gap - 505 + 320 + gap) * Math.random());
		var topPipeY = position-360;
		var bottomPipeY = position+gap;

		if(this.resetPipe(topPipeY,bottomPipeY)) return;

		var topPipe = game.add.sprite(game.width, topPipeY, 'pipe', 0, this.pipeGroup);
		var bottomPipe = game.add.sprite(game.width, bottomPipeY, 'pipe', 1, this.pipeGroup);
		this.pipeGroup.setAll('checkWorldBounds',true);
		this.pipeGroup.setAll('outOfBoundsKill',true);
		this.pipeGroup.setAll('body.velocity.x', -this.gameSpeed);
	}

	this.resetPipe = function(topPipeY,bottomPipeY){//重置出了边界的管道，做到回收利用
		var i = 0;
		this.pipeGroup.forEachDead(function(pipe){
			if(pipe.y<=0){ //topPipe
				pipe.reset(game.width, topPipeY);
				pipe.hasScored = false; //重置为未得分
			}else{
				pipe.reset(game.width, bottomPipeY);
			}
			pipe.body.velocity.x = -this.gameSpeed;
			i++;
		}, this);
		return i == 2; //如果 i==2 代表有一组管道已经出了边界，可以回收这组管道了
	}

	this.checkScore = function(pipe){//负责分数的检测和更新
		if(!pipe.hasScored && pipe.y<=0 && pipe.x<=this.fox.x-17-54){
			pipe.hasScored = true;
			this.scoreText.text = ++this.score;
			this.soundScore.play();
			return true;
		}
		return false;
	}
}

//添加state到游戏
game.state.add('boot',game.States.boot);
game.state.add('preload',game.States.preload);
game.state.add('menu',game.States.menu);
game.state.add('play',game.States.play);
game.state.start('boot'); //启动游戏


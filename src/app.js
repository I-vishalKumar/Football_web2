let PUBLIC_KEY , SECRET_KEY;

if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
   PUBLIC_KEY = process.env.PUBLIC_KEY;
   SECRET_KEY = process.env.SECRET_KEY;
}

const {
  express , hbs , path ,
  mongoose , jwt , cookieParser ,
  crypto , request , jssha , session ,
  MongoDBStore , user_data , admin_function , user_function
} = require('./controlers/imports');

const static_path = path.join( __dirname , '../' , 'public' );
const {User, Bet ,Deposit,Withdrawal} = require('./db');
const port = process.env.PORT || 2000;


const app = express();

app.use(express.urlencoded({extended : true}));
app.set('view engine' , 'hbs');
app.use(cookieParser());
app.use(express.json());



app.use(express.static(static_path));


let link = 'mongodb+srv://herofootball:hero%40123@cluster0.ujlhaqb.mongodb.net/heroFootball?retryWrites=true&w=majority';

mongoose.connect(link)
  .then(function(db){
    console.log('dtabse connected');
  app.listen(port , ()=>{
    console.log(`listening on ${port}`);
  })

})
  .catch(function(err){
  console.log(err);
})

const JWT_SECRET = 'VISHAL';

const one_day = 1000 * 60 * 60 * 100;

var store = new MongoDBStore(
  {
    uri: link,
    databaseName: 'heroFootball',
    collection: 'sessions'
  });

app.use(
  session({
  secret : 'vishal',
  resave : false,
  saveUninitialized: false,
  cookie: { maxAge: one_day },
  store : store
}));

const isAuthenticated = (req, res, next) => {
  if(req.session.user_id){
    next();
  }else{
    res.redirect('/login');
  }
}



app.get('/terms' , (req, res)=>{
  return res.render('terms');
})

app.get('/' , (req , res)=>{
  res.render('login');
})

app.get("/home" ,isAuthenticated, (req,res)=>{

  // if(temp_user['last_spin'] !== 0 && temp_user['last_spin'] < date.now().getDate()){
    res.render('home' , {
      spinner : `<div class="spinner_pop_btn">

      </div>`
    })
    // }
    // res.render('home')

  });

app.get('/login' , (req , res)=>{
    res.render("login");
  });

app.get('/signup' , (req,res)=>{

    let code = parseInt(req.query.id);
    return res.render("login" , {inv_code : code});

})

app.get('/logout' , (req,res)=>{
    req.session.destroy();
    res.clearCookie('connect.sid');

    res.redirect("/login");
})

// getting all the user data;

app.get('/user_data' ,isAuthenticated, user_data.get_data );

app.get('/get_payment_data' ,isAuthenticated ,  user_data.get_payment_data );

app.get('/get_all_members' ,isAuthenticated , user_data.get_members_data );

app.get('/get_bet_history' ,isAuthenticated ,  user_data.get_bet_data );




// user functions
app.post('/login' , user_function.login_user);

app.post('/signup' , user_function.sign_new_user);

app.post('/placebet' , isAuthenticated , user_function.place_bet);

app.post('/usdt' , isAuthenticated , user_function.usdt);

app.post('/delbet', isAuthenticated ,  user_function.delete_bet);

app.post('/deposit' , isAuthenticated , user_function.deposited);

app.post('/withdrawal' , isAuthenticated , user_function.withdrawal);

app.post('/spinner_update' , isAuthenticated , user_function.spinner_update);

app.post('/bank_details' , isAuthenticated , user_function.add_bank_details);

app.post('/withdrawal_code' , isAuthenticated , user_function.withdrawal_code);

app.post('/password' , isAuthenticated , user_function.change_password);


// admin functions
app.get('/AdMiNgRoUp/league_0' , (req , res)=>{
  res.render('bet_settle');
});

app.post('/AdMiNgRoUp/league_0' , admin_function.settle_bet);

app.post('/gather-deposit-data' , admin_function.get_settle_deposit_data);

app.post('/settle_deposit'  , admin_function.settle_deposit);

app.post("/settle_withdrawal" , admin_function.settle_withdrawal);

app.post('/shit_happened' , admin_function.done_some_shit);

app.post('/virtual_settle' , admin_function.virtual_settle);

app.post('/cancel_withdrawal' , admin_function.cancel_withdrawal);

app.post('/null_settlement' , admin_function.null_bet);
// super admin
app.get('/find_deposit_revenue_generated' , admin_function.deposit_find);
app.post('/test_settle_bets' , admin_function.test_settle_bet);

if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Campground = require('./models/campground');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const dbUrl = process.env.DB_URL
// 'mongodb://localhost:27017/transaction-receipt'
mongoose.set('strictQuery',false);
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.use(express.static(path.join(__dirname, 'public')))
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Middleware
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    next();
}


const regUrl = process.env.REGISTER_URL
//Routes for Register and login
app.get(regUrl,(req, res) =>{
    res.render('users/register');
});
app.post(regUrl, async (req, res, next) => {
    let registeredUser 
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.redirect('/transactionSlips');
        })
    } catch (e) {
        
        res.redirect('/login');
    }
    
});

app.get('/login', (req, res) => {
    res.render('users/login');
})

app.post('/login', passport.authenticate('local', { failureMessage: true, failureRedirect: '/login' }), (req, res) => {
    res.redirect('/transactionSlips');
})
app.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
       
        res.redirect('/');
      });
    
})

// Routes for Transactions
app.get('/', (req, res) => {
    res.redirect('/transactionSlips');
});
app.get('/transactionSlips', isLoggedIn, async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
});
app.get('/transactionSlips/new', isLoggedIn, (req, res) => {
    res.render('campgrounds/new');
})

app.post('/transactionSlips', isLoggedIn, async (req, res) => {
    const campground = new Campground({...req.body.campground, ref:''});
    // const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/transactionSlips/${campground._id}`)
})

app.get('/transactionSlips/:id', isLoggedIn, async (req, res,) => {
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/show', { campground });
});

app.get('/transactionSlips/:id/edit', isLoggedIn, async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/edit', { campground });
})
app.get('/transactionSlips/:id/addrefer', async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/addrefer', { campground });
})
app.get('/transactionSlips/:id/updateRefer', async(req,res) => {
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/updaterefer', { campground });
})
app.put('/transactionSlips/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const existCamp = await Campground.findById(req.params.id);
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    res.redirect(`/transactionSlips/${campground._id}`)
});

app.put('/transactionSlips/:id/updateRefer', async (req, res) => {
    const { id } = req.params;
    const existCamp = await Campground.findById(req.params.id);
    const campground = await Campground.findByIdAndUpdate(id, { name:existCamp.name, amount:existCamp.amount, upi:existCamp.upi, ref:req.body.campground.ref });
    res.redirect(`/transactionSlips/${campground._id}/updateRefer`)
});

app.delete('/transactionSlips/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/transactionSlips');
})



const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})
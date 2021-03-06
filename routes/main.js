const router = require('express').Router()
const faker = require('faker')
const Product = require('../models/product');
const Review = require('../models/review');
const axios = require('axios');


router.get('/generate-fake-data', (req, res, next) => {

  for (let i = 0; i < 90; i++) {
    // Create a new product instace
    let product = new Product()
    // set data
    product.category = faker.commerce.department()
    product.name = faker.commerce.productName()
    product.image = 'https://images.unsplash.com/photo-1510074630444-b83d96ed9677?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=500&h=300&fit=crop&ixid=eyJhcHBfaWQiOjF9';
    product.price = faker.commerce.price()
    product.save((err) => {
      if (err) throw err
    })
  }
  res.end()
})


// Get all products, queries are optional
router.get('/products', (req, res, next) => {
  const category = req.query.category;
  const priceSort = req.query.price;
  const productName = req.query.productName;
  let productNameQuery;
  let categoryQuery;
  let priceQuery;
  const perPage = 9;
  const page = +req.query.page || 1;

  productName ? productNameQuery = { name: productName } : productNameQuery = { name: '' };
  category ? categoryQuery = { category } : categoryQuery = {};
  priceSort === 'lowest' ? priceQuery = { price: 1 } :
    priceSort === 'highest' ?
      priceQuery = { price: -1 } :
      priceQuery = {}

  Product
    .find(categoryQuery)
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .sort(priceQuery)
    .exec((err, productsFound) => {
      Product.countDocuments().then((count) => {
        // Query used to to find the categories
        Product.find()
          .exec((err, products) => {
            categoryList = products.map((item) => {
              return item.category
            })
            const uniqueCategoryList = Array.from(new Set(categoryList));
            // Query used to to find a product by Name
            Product.find(productNameQuery)
              .exec((err, productFoundByName) => {
                Product
                  .find(categoryQuery)
                  .countDocuments()
                  .exec((err, countCategory) => {
                    res.status(200).send({
                      productsFound,
                      count,
                      perPage,
                      uniqueCategoryList,
                      productFoundByName,
                      countCategory
                    });
                  })
              })
          })
      })
    })

});

// Return a specific product by ID
router.get('/products/:productId', (req, res, next) => {
  const productId = req.params.productId
  Product.findById(productId).exec((err, product) => {
    res.send(product);
  })
});

// Return all reviews, but limited to 40 at a time. Pass in an options page query 
// to paginate 
router.get('/reviews', (req, res, next) => {
  const perPage = 40;
  const page = req.query.page || 1;

  Review
    .find({})
    .skip((page * perPage) - perPage)
    .exec((err, reviews) => {
      res.status(200).send(reviews);
    })
});

// Create a new product in the database
router.post('/products', (req, res, next) => {
  const productToAdd = req.body;
  let product = new Product(productToAdd);
  product.save();
  res.status(200).send('successfully added post');
});

// Create a new review in the database by adding it the correct product's reviews array
router.post('/:productId/reviews', (req, res, next) => {
  const reviewToAdd = req.body;
  const productId = req.params.productId;

  Product.findById(productId).exec((err, product) => {
    let review = new Review(reviewToAdd);
    review.save();
    product.reviews.push(review);
    product.save();
    res.status(200).send('successfully added review');
  });
});

// Delete a product by Id
router.delete('/products/:productId', (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId).exec((err, product) => {
    product.remove()
    res.status(200).send('Successfully deleted product');
  })
});

// Delete review by Id
router.delete('/reviews/:reviewId', (req, res, next) => {
  const reviewId = req.params.reviewId;
  Review.findById(reviewId).exec((err, review) => {
    review.remove();
    res.status(200).send('Successfully deleted review');
  })
});

module.exports = router
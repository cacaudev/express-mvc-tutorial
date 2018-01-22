var BookInstance = require("../models/bookinstance");
var Book         = require("../models/book");

var async = require("async");

const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res) {
  BookInstance.find()
    .populate("book")
    .sort([["_id", "ascending"]])
    .exec(function(err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render("pages/book_instance_list", {
        title: "Lista de Exemplares de Livros",
        bookinstance_list: list_bookinstances
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res) {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function(err, bookinstance) {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        var err = new Error("Exemplar não encontrado.");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("pages/bookinstance_detail", {
        title: "Informaçãoes do Exemplar",
        bookinstance: bookinstance
      });
  });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res) {
  Book.find({}, "title")
    .sort([['title','ascending']])
    .exec(function(err, books) {
  
    if (err) {
      return next(err);
    }
    // Successful, so render.
    res.render("pages/bookinstance_form", {
      title: "Cadastrar Exemplar",
      book_list: books,
      bookinstance: "",
      errors: ""
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate fields.
  body("book", "Book must be specified")
    .isLength({ min: 1 })
    .trim(),
  body("imprint", "Imprint must be specified")
    .isLength({ min: 1 })
    .trim(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601(),

  // Sanitize fields.
  sanitizeBody("book")
    .trim()
    .escape(),
  sanitizeBody("imprint")
    .trim()
    .escape(),
  sanitizeBody("status")
    .trim()
    .escape(),
  sanitizeBody("due_back").toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    var bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").exec(function(err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render("pages/bookinstance_form", {
          title: "Cadastrar Exemplar",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance
        });
      });
      return;
    } else {
      // Data from form is valid.
      bookinstance.save(function(err) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new record.
        res.redirect(bookinstance.url);
      });
    }
  }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res) { 
  BookInstance.findById(req.params.id)
  .populate('book')
  .exec(function(err, bookinstance) {
    if (err) { return next(err); }
    if (bookinstance == null) { // No results.
      res.redirect('/catalog/bookinstances');
    }
    // Successful, so render.
    res.render("pages/book_instance_delete", {
      title: "Excluir Exemplar",
      bookinstance: bookinstance
    });
  })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) {
  BookInstance.findByIdAndRemove(req.body.instanceid, function deleteBookInstance(err) {
    if (err) { return next(err); }
    // Success - go to bookinstance list
    res.redirect('/catalog/bookinstances');    
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {
  async.parallel({
    bookinstance: function(callback) {
      BookInstance.findById(req.params.id)
      .populate("book")
      .exec(callback);
    },
    books: function(callback) {
      Book.find()
      .sort([['title', 'ascending']])
      .exec(callback);
    },
  }, function (err, results) {
    if (err) { return next(err); }
    if (results.bookinstance == null) { // No results.
      var err = new Error('Exemplar não encontrado.');
			err.status = 404;
			return next(err);
    }
    // Successful, so render.
    res.render("pages/bookinstance_form", {
      title: "Modificar Exemplar",
      book_list: results.books,
			bookinstance: results.bookinstance,
			errors: ''
    });
  });
};   
  
// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate fields.
	body('book', 'Livro deve ser selecionado.').isLength({ min: 1 }).trim(),
	body('imprint', 'Campo Publicação não pode estar vazio.').isLength({ min: 1 }).trim(),
	body('due_back', 'Campo data não pode estar vazio.').isLength({ min: 1 }).trim(),
	body('status', 'Status deve ser selecionado.').isLength({ min: 1 }).trim(),

	// Sanitize fields.
	sanitizeBody('book').trim().escape(),
	sanitizeBody('imprint').trim().escape(),
	sanitizeBody('due_back').trim().escape(),
	sanitizeBody('status').trim().escape(),

  	// Process request after validation and sanitization.
	(req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id.
    var bookinstance = new BookInstance(
      { book: req.body.book,
        imprint: req.body.imprint,
        due_back: req.body.due_back,
        status: req.body.status,
        _id:req.params.id //This is required, or a new ID will be assigned!
      });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all books for form.
      Book.find({},'title')
      .exec(function (err, books) {
        if (err) { return next(err); }
        res.render('pages/bookinstance_form', { 
          title: 'Modificar Exemplar',
          book_list: books, 
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance 
        });
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err,thebookinstance) {
        if (err) { return next(err); }
          // Successful - redirect to book detail page.
          res.redirect(thebookinstance.url);
      });
    }
  }
];

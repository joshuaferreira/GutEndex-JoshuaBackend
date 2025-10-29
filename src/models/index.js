const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: process.env.DB_DIALECT,
    logging: false,
    define: {
      timestamps: false,     
      underscored: true,
      freezeTableName: true
    }
  }
);

//Book Model
const Book = sequelize.define(
  'Book', 
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    download_count: DataTypes.INTEGER,
    gutenberg_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    media_type: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    title: DataTypes.TEXT
  }, 
  {
    tableName: 'books_book',
  }
);

//Author Model
const Author = sequelize.define(
  'Author', 
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    birth_year: DataTypes.SMALLINT,
    death_year: DataTypes.SMALLINT,
    name: {
      type: DataTypes.STRING(128),
      allowNull: false
    }
  }, 
  {
    tableName: 'books_author'  
  }
);

//Bookshelf Model
const Bookshelf = sequelize.define(
  'Bookshelf', 
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false
    }
  }, 
  {
    tableName: 'books_bookshelf',
  }
);

//Format Model
const Format = sequelize.define(
  'Format', 
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mime_type: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, 
  {
    tableName: 'books_format',
  }
);

// Language Model
const Language = sequelize.define(
  'Language', 
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(4),
      allowNull: false
    }
  }, 
  {
    tableName: 'books_language',
  }
);

// Subject Model
const Subject = sequelize.define(
  'Subject', 
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, 
  {
    tableName: 'books_subject',
  }
);

// Junction tables
const BookAuthor = sequelize.define(
  'BookAuthor', 
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    book_id: DataTypes.INTEGER,
    author_id: DataTypes.INTEGER
  }, 
  {
    tableName: 'books_book_authors',
  }
);

const BookBookshelf = sequelize.define(
  'BookBookshelf', 
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    book_id: DataTypes.INTEGER,
    bookshelf_id: DataTypes.INTEGER
  }, 
  {
    tableName: 'books_book_bookshelves',
  }
);

const BookLanguage = sequelize.define(
  'BookLanguage', 
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    book_id: DataTypes.INTEGER,
    language_id: DataTypes.INTEGER
  }, 
  {
    tableName: 'books_book_languages',
  }
);

const BookSubject = sequelize.define(
  'BookSubject',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    book_id: DataTypes.INTEGER,
    subject_id: DataTypes.INTEGER
  }, 
  {
    tableName: 'books_book_subjects',
  }
);

// Define Associations
Book.belongsToMany(Author, { through: BookAuthor, foreignKey: 'book_id', otherKey: 'author_id', as: 'authors' });
Author.belongsToMany(Book, { through: BookAuthor, foreignKey: 'author_id', otherKey: 'book_id' });

Book.belongsToMany(Bookshelf, { through: BookBookshelf, foreignKey: 'book_id', otherKey: 'bookshelf_id', as: 'bookshelves' });
Bookshelf.belongsToMany(Book, { through: BookBookshelf, foreignKey: 'bookshelf_id', otherKey: 'book_id' });

Book.belongsToMany(Language, { through: BookLanguage, foreignKey: 'book_id', otherKey: 'language_id', as: 'languages' });
Language.belongsToMany(Book, { through: BookLanguage, foreignKey: 'language_id', otherKey: 'book_id' });

Book.belongsToMany(Subject, { through: BookSubject, foreignKey: 'book_id', otherKey: 'subject_id', as: 'subjects' });
Subject.belongsToMany(Book, { through: BookSubject, foreignKey: 'subject_id', otherKey: 'book_id' });

Book.hasMany(Format, { foreignKey: 'book_id', as: 'formats' });
Format.belongsTo(Book, { foreignKey: 'book_id' });

module.exports = {
  sequelize,
  Author,
  Book,
  Bookshelf,
  Format,
  Language,
  Subject,
  BookAuthor,
  BookBookshelf,
  BookLanguage,
  BookSubject
};


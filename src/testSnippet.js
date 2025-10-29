import { sequelize, Book, Author } from "./models/index.js";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully!");

    const book = await Book.findOne({
      include: [{ model: Author, as: "authors" }],
    });

    if (book) {
      console.log("Example Book:", JSON.stringify(book, null, 2));
    } else {
      console.log("No books found in the database.");
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  } finally {
    await sequelize.close();
  }
})();

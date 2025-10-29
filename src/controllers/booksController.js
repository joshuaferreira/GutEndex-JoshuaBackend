const { Op } = require('sequelize');
const { Book, Author, Language, Subject, Bookshelf, Format, sequelize } = require('../models/index.js');

const getBooks = async (req, res) => {
    try {
        const {
        gutenberg_id,
        language,
        mime_type,
        topic,
        author,
        title,
        page = 1
        } = req.query;

        // Pagination setup

        // Default limit to 25 items per page
        const limit = 25;
        // Calculate offset
        const offset = (page - 1) * limit;

        // Build where conditions for the main Book query
        const bookWhere = {};
    
        // Filter by Gutenberg IDs (supports comma-separated and repeated params)
        if (gutenberg_id) {
            const tokens = Array.isArray(gutenberg_id) ? gutenberg_id : [gutenberg_id];
            const ids = [...new Set(
              tokens
                .flatMap(v => String(v).split(','))
                .map(s => parseInt(s.trim(), 10))
                .filter(Number.isFinite)
            )];

            if (ids.length) {
                bookWhere.gutenberg_id = { [Op.in]: ids };
            }
        }

                // Filter by title; support multiple comma-separated phrases.
                // Each phrase can have spaces; we match all tokens in the phrase (AND) and OR across phrases.
                // Case-insensitive under MySQL ci collations.
                if (title) {
                        const titleTerms = title
                            .split(',')
                            .map(s => s.trim().toLowerCase())
                            .filter(Boolean);

                        const buildTitleClause = (phrase) => {
                            const tokens = phrase.split(/\s+/).filter(Boolean);
                            if (tokens.length <= 1) {
                                return { title: { [Op.like]: `%${phrase}%` } };
                            }
                            return {
                                [Op.and]: tokens.map(tok => ({ title: { [Op.like]: `%${tok}%` } }))
                            };
                        };

                        if (titleTerms.length === 1) {
                            bookWhere[Op.and] = [buildTitleClause(titleTerms[0])];
                        } else if (titleTerms.length > 1) {
                            bookWhere[Op.or] = titleTerms.map(buildTitleClause);
                        }
                }

        // Build include array with filters
        const include = [
        {
            model: Author,
            as: 'authors',
            attributes: ['id', 'name', 'birth_year', 'death_year'],
            through: { attributes: [] },
                        ...(author && {
                                // Support multiple comma-separated author phrases.
                                // For each phrase, split by whitespace and require all tokens (AND) to match in the name.
                                where: {
                                    [Op.or]: author
                                        .split(',')
                                        .map(a => a.trim().toLowerCase())
                                        .filter(Boolean)
                                        .map(phrase => {
                                                const tokens = phrase.split(/\s+/).filter(Boolean);
                                                if (tokens.length <= 1) return { name: { [Op.like]: `%${phrase}%` } };
                                                return {
                                                    [Op.and]: tokens.map(tok => ({ name: { [Op.like]: `%${tok}%` } }))
                                                };
                                        })
                                },
                                required: true
                        })
        },
        {
            model: Language,
            as: 'languages',
            attributes: ['code'],
            through: { attributes: [] },
            ...(language && {
                where: {
                    code: { [Op.in]: language.split(',').map(l => l.trim().toLowerCase()) }
                },
                required: true
            })
        },
        {
            model: Subject,
            as: 'subjects',
            attributes: ['name'],
            through: { attributes: [] }
        },
        {
            model: Bookshelf,
            as: 'bookshelves',
            attributes: ['name'],
            through: { attributes: [] }
        },
        {
        model: Format,
        as: 'formats',
        attributes: ['mime_type', 'url'],
        ...(mime_type && {
            where: {
            [Op.or]: mime_type
                .split(',')
                .map(m => m.trim().toLowerCase())
                .filter(Boolean)
                .map(token => {
                  const topLevel = ['application', 'audio', 'font', 'example', 'image', 'message', 'model', 'multipart', 'text', 'video'];
                  if (topLevel.includes(token)) {
                    // Match category like "audio/*"
                    return { mime_type: { [Op.like]: `${token}/%` } };
                  }
                  // Match partials like "pdf", "epub", etc.
                  return { mime_type: { [Op.like]: `%${token}%` } };
                })
            },
            required: true
        })
        }
        ];

    const queryOptions = {
            where: bookWhere,
      include,
      limit,
      offset,
      order: [['download_count', 'DESC']],
      distinct: true
    };

                // Topic filter: support multiple comma-separated topics (OR across all) using association paths
                if (topic) {
                        const topicTerms = topic
                            .split(',')
                            .map(t => t.trim().toLowerCase())
                            .filter(Boolean);
                        if (topicTerms.length) {
                            const topicOr = topicTerms.flatMap(t => ([
                                { '$subjects.name$': { [Op.like]: `%${t}%` } },
                                { '$bookshelves.name$': { [Op.like]: `%${t}%` } }
                            ]));
                            if (Object.keys(bookWhere).length > 0) {
                                    queryOptions.where = { [Op.and]: [bookWhere, { [Op.or]: topicOr }] };
                            } else {
                                    queryOptions.where = { [Op.or]: topicOr };
                            }
                            // Ensure aliases are available in WHERE by avoiding subquery; group by Book.id to prevent row explosion
                            queryOptions.subQuery = false;
                            if (!queryOptions.group) {
                                queryOptions.group = ['Book.id'];
                            }
                        }
                }

    const { count, rows: books } = await Book.findAndCountAll(queryOptions);

    // Format response
const formattedBooks = books.map(
    book => (
                {
                    id: book.gutenberg_id ?? null,
                    title: book.title ?? null,   

                    authors: (book.authors ?? []).map(
                        a => ({
                            name: a?.name ?? null,
                            birth_year: a?.birth_year ?? null,
                            death_year: a?.death_year ?? null
                        })
                    ),

                    genre: [
                    ...((book.subjects ?? []).map(subject => subject?.name).filter(Boolean)),
                    ...((book.bookshelves ?? []).map(shelf => shelf?.name).filter(Boolean))
                    ],   

                    languages: (book.languages ?? []).map(l => l?.code).filter(Boolean),

                    subjects: (book.subjects ?? []).map(s => s?.name).filter(Boolean),

                    bookshelves: (book.bookshelves ?? []).map(b => b?.name).filter(Boolean),
                    
                    download_count: book.download_count ?? 0,

                    formats: (book.formats ?? []).map(f => ({
                        mime_type: f?.mime_type ?? null,
                        url: f?.url ?? null
                    }))
                }
            )
);

    res.json({
      count: typeof count === 'number' ? count : count.length,
      next: offset + limit < (typeof count === 'number' ? count : count.length) ? parseInt(page) + 1 : null,
      previous: page > 1 ? parseInt(page) - 1 : null,
      results: formattedBooks
    });

  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

module.exports = {
  getBooks
};
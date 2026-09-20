/* =========================================================
AGASOBANUYE DOWNLOAD WEBSITE
AGASOBANUYE + NCDTV
========================================================= */

/* =========================================================
API
========================================================= */

const API_URL =
"https://moviepulse247.netlify.app/.netlify/functions/agasobanuye-movies";


/* =========================================================
GLOBAL STATE
========================================================= */

let allMovies = [];

let currentMovies = [];

let currentPage = 1;

let hasNextPage = true;

let isLoading = false;

const moviesPerPage = 20;


/* =========================================================
NCDTV MOVIES
========================================================= */

const localNCDTVMovies =
    Array.isArray(window.ncdtvMovies)
        ? window.ncdtvMovies
        : [];


/* =========================================================
DOM HELPERS
========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


/* =========================================================
ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(value) {

    return escapeHtml(value)
        .replace(/`/g, "&#096;");

}


/* =========================================================
POSTER FALLBACK
========================================================= */

function posterFallback(
    title = "Movie"
) {

    const text =
        encodeURIComponent(
            title.substring(0, 25)
        );

    return `https://placehold.co/640x360/111111/ffffff?text=${text}`;

}


/* =========================================================
API REQUEST
========================================================= */

async function fetchMovies(page = 1) {

    const url =
        `${API_URL}?page=${page}&limit=${moviesPerPage}`;

    const response =
        await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

    if (!response.ok) {

        throw new Error(
            `API request failed: ${response.status}`
        );

    }

    const data =
        await response.json();

    if (
        !data ||
        data.success !== true
    ) {

        throw new Error(
            "The movie API returned an invalid response."
        );

    }

    return data;

}


/* =========================================================
COMBINE MOVIES
========================================================= */

function combineMovies(agasobanuyeMovies = []) {

    return [
        ...localNCDTVMovies,
        ...agasobanuyeMovies
    ];

}


/* =========================================================
MOVIE CARD
========================================================= */

function createMovieCard(movie) {

    const id =
        movie.id || "";

    const title =
        movie.title ||
        "Untitled Movie";

    const poster =
        movie.poster ||
        posterFallback(title);

    const summary =
        movie.summary ||
        (
            movie.source === "NCDTV"
                ? "Movie available from NCDTV."
                : "Agasobanuye movie available for download."
        );


    const movieUrl =
        `download.html?movie=${encodeURIComponent(id)}`;


    const source =
        movie.source ||
        "Agasobanuye";


    const isNCDTV =
        source === "NCDTV";


    const watchUrl =
        isNCDTV && movie.sourceUrl
            ? movie.sourceUrl
            : `https://moviepulse247.netlify.app/source-movies.html?movie=${encodeURIComponent(id)}`;


    return `

        <article class="movie-card">

            <a
                href="${movieUrl}"
                aria-label="Download ${escapeAttribute(title)}"
            >

                <div class="movie-poster">

                    <img
                        src="${escapeAttribute(poster)}"
                        alt="${escapeAttribute(title)}"
                        loading="lazy"
                        onerror="this.onerror=null;this.src='${posterFallback(title)}'"
                    >

                    <span class="download-badge">
                        Download
                    </span>

                </div>

            </a>


            <div class="movie-info">

                <a
                    href="${movieUrl}"
                    class="movie-title"
                    title="${escapeAttribute(title)}"
                >
                    ${escapeHtml(title)}
                </a>


                <p class="movie-summary">
                    ${escapeHtml(summary)}
                </p>


                <div
                    class="movie-source"
                    style="
                        font-size:12px;
                        margin:6px 0 10px;
                        opacity:.7;
                    "
                >
                    ${escapeHtml(source)}
                </div>


                <div class="movie-actions">

                    <a
                        href="${movieUrl}"
                        class="movie-action download"
                    >

                        <i class="fa-solid fa-download"></i>

                        Download

                    </a>


                    ${
                        watchUrl
                            ? `
                                <a
                                    href="${escapeAttribute(watchUrl)}"
                                    class="movie-action watch"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >

                                    <i class="fa-solid fa-play"></i>

                                    ${
                                        isNCDTV
                                            ? "Source"
                                            : "Watch"
                                    }

                                </a>
                              `
                            : `
                                <a
                                    href="${movieUrl}"
                                    class="movie-action watch"
                                >

                                    <i class="fa-solid fa-circle-info"></i>

                                    Details

                                </a>
                              `
                    }

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
RENDER MOVIES
========================================================= */

function renderMovies(movies) {

    const grid =
        getElement("movieGrid");

    const emptyBox =
        getElement("emptyBox");


    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    if (
        !movies ||
        movies.length === 0
    ) {

        if (emptyBox) {
            emptyBox.hidden = false;
        }

        return;

    }


    if (emptyBox) {
        emptyBox.hidden = true;
    }


    grid.innerHTML =
        movies
            .map(createMovieCard)
            .join("");

}


/* =========================================================
UPDATE COUNT
========================================================= */

function updateMovieCount(count) {

    const element =
        getElement("movieCount");


    if (!element) {
        return;
    }


    element.textContent =
        Number(count || 0)
            .toLocaleString();

}


/* =========================================================
LOADING HELPERS
========================================================= */

function showMainLoading() {

    const loading =
        getElement("loading");


    if (!loading) {
        return;
    }


    loading.hidden = false;

    loading.style.display = "flex";

}


function hideMainLoading() {

    const loading =
        getElement("loading");


    if (!loading) {
        return;
    }


    loading.hidden = true;

    loading.style.display = "none";

}


/* =========================================================
LOAD MOVIES
========================================================= */

async function loadMovies(reset = false) {

    if (isLoading) {
        return;
    }


    if (reset) {

        currentPage = 1;

        hasNextPage = true;

        allMovies = [];

        currentMovies = [];


        const grid =
            getElement("movieGrid");


        if (grid) {
            grid.innerHTML = "";
        }

    }


    if (
        !hasNextPage &&
        !reset
    ) {
        return;
    }


    isLoading = true;


    const errorBox =
        getElement("errorBox");


    const loadMoreContainer =
        getElement("loadMoreContainer");


    if (errorBox) {
        errorBox.hidden = true;
    }


    if (currentPage === 1) {
        showMainLoading();
    }


    try {

        const data =
            await fetchMovies(
                currentPage
            );


        const apiMovies =
            Array.isArray(data.movies)
                ? data.movies
                : [];


        if (reset) {

            allMovies =
                combineMovies(
                    apiMovies
                );

        } else {

            allMovies =
                [
                    ...allMovies,
                    ...apiMovies
                ];

        }


        currentMovies =
            [...allMovies];


        hasNextPage =
            Boolean(data.hasNext);


        updateMovieCount(
            allMovies.length
        );


        renderMovies(
            currentMovies
        );


        if (loadMoreContainer) {

            loadMoreContainer.hidden =
                !hasNextPage;

        }


        currentPage++;


    } catch (error) {

        console.error(
            "Movie loading error:",
            error
        );


        if (errorBox) {

            errorBox.hidden = false;


            const errorMessage =
                getElement("errorMessage");


            if (errorMessage) {

                errorMessage.textContent =
                    error.message ||
                    "Unable to load movies.";

            }

        }

    } finally {

        isLoading = false;

        hideMainLoading();

    }

}


/* =========================================================
SEARCH
========================================================= */

function searchMovies(query) {

    const value =
        String(query || "")
            .trim()
            .toLowerCase();


    if (!value) {

        currentMovies =
            [...allMovies];

    } else {

        currentMovies =
            allMovies.filter(
                movie => {

                    const title =
                        String(
                            movie.title || ""
                        ).toLowerCase();


                    const summary =
                        String(
                            movie.summary || ""
                        ).toLowerCase();


                    const category =
                        String(
                            movie.category || ""
                        ).toLowerCase();


                    const source =
                        String(
                            movie.source || ""
                        ).toLowerCase();


                    return (
                        title.includes(value) ||
                        summary.includes(value) ||
                        category.includes(value) ||
                        source.includes(value)
                    );

                }
            );

    }


    updateMovieCount(
        currentMovies.length
    );


    renderMovies(
        currentMovies
    );

}


/* =========================================================
DOWNLOAD PAGE
========================================================= */

async function loadDownloadPage() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const movieId =
        params.get("movie");


    if (!movieId) {

        showDownloadError(
            "No movie was specified."
        );

        return;

    }


    const loading =
        getElement("downloadLoading");


    const content =
        getElement("downloadContent");


    try {

        let movie =
            localNCDTVMovies.find(
                item =>
                    String(item.id) ===
                    String(movieId)
            );


        if (!movie) {

            movie =
                allMovies.find(
                    item =>
                        String(item.id) ===
                        String(movieId)
                );

        }


        if (!movie) {

            movie =
                await findMovieById(
                    movieId
                );

        }


        if (!movie) {

            throw new Error(
                "This movie could not be found."
            );

        }


        if (!movie.downloadUrl) {

            throw new Error(
                "A download file is not currently available for this movie."
            );

        }


        renderDownloadPage(
            movie
        );


        await loadRelatedMovies(
            movie.id
        );


    } catch (error) {

        console.error(
            "Download page error:",
            error
        );


        showDownloadError(
            error.message ||
            "Unable to prepare this movie."
        );

    } finally {

        if (loading) {

            loading.hidden = true;

            loading.style.display =
                "none";

        }

    }

}


/* =========================================================
FIND MOVIE BY ID
========================================================= */

async function findMovieById(movieId) {

    const localMovie =
        localNCDTVMovies.find(
            movie =>
                String(movie.id) ===
                String(movieId)
        );


    if (localMovie) {
        return localMovie;
    }


    let page = 1;

    const maxPages = 20;


    while (page <= maxPages) {

        const data =
            await fetchMovies(page);


        const movies =
            Array.isArray(data.movies)
                ? data.movies
                : [];


        const found =
            movies.find(
                movie =>
                    String(movie.id) ===
                    String(movieId)
            );


        if (found) {
            return found;
        }


        if (!data.hasNext) {
            break;
        }


        page++;

    }


    return null;

}


/* =========================================================
RENDER DOWNLOAD PAGE
========================================================= */

function renderDownloadPage(movie) {

    const content =
        getElement("downloadContent");


    const title =
        movie.title ||
        "Untitled Movie";


    const poster =
        movie.poster ||
        posterFallback(title);


    const summary =
        movie.summary ||
        (
            movie.source === "NCDTV"
                ? "Movie available from NCDTV."
                : "Agasobanuye movie available for download."
        );


    const downloadButton =
        getElement("downloadButton");


    const watchButton =
        getElement("watchMovieButton");


    const titleElement =
        getElement("downloadTitle");


    const posterElement =
        getElement("downloadPoster");


    const summaryElement =
        getElement("downloadSummary");


    const metaElement =
        getElement("downloadMeta");


    const isNCDTV =
        movie.source === "NCDTV";


    /* =====================================================
    TITLE
    ===================================================== */

    if (titleElement) {

        titleElement.textContent =
            title;

    }


    /* =====================================================
    POSTER
    ===================================================== */

    if (posterElement) {

        posterElement.src =
            poster;

        posterElement.alt =
            title;


        posterElement.onerror =
            function () {

                this.onerror = null;

                this.src =
                    posterFallback(title);

            };

    }


    /* =====================================================
    SUMMARY
    ===================================================== */

    if (summaryElement) {

        summaryElement.textContent =
            summary;

    }


    /* =====================================================
    META
    ===================================================== */

    if (metaElement) {

        const meta = [];


        if (movie.category) {

            meta.push(
                `<span>${escapeHtml(movie.category)}</span>`
            );

        }


        if (movie.duration) {

            meta.push(
                `<span>${escapeHtml(movie.duration)}</span>`
            );

        }


        meta.push(
            `<span>${isNCDTV ? "NCDTV" : "Agasobanuye"}</span>`
        );


        metaElement.innerHTML =
            meta.join("");

    }


    /* =====================================================
    DOWNLOAD BUTTON
    ===================================================== */

  if (downloadButton) {
    if (movie.downloadUrl) {

        downloadButton.href = movie.downloadUrl;
        downloadButton.target = "_blank";
        downloadButton.rel = "noopener noreferrer";

        // Do NOT use the HTML download attribute
        downloadButton.removeAttribute("download");

        downloadButton.innerHTML = `
            <i class="fa-solid fa-download"></i>
            <span>Download Movie</span>
        `;

        downloadButton.style.display = "flex";

    } else {

        downloadButton.removeAttribute("href");
        downloadButton.style.display = "none";

    }
}

    /* =====================================================
    WATCH / SOURCE BUTTON
    ===================================================== */

    if (watchButton) {

        if (
            isNCDTV &&
            movie.sourceUrl
        ) {

            watchButton.href =
                movie.sourceUrl;

        } else {

            watchButton.href =
                "https://moviepulse247.netlify.app/source-movies.html";

        }


        watchButton.target =
            "_blank";


        watchButton.rel =
            "noopener noreferrer";


        watchButton.innerHTML =
            `
                <i class="fa-solid fa-play"></i>
                ${
                    isNCDTV
                        ? "View on NCDTV"
                        : "Watch Movie"
                }
            `;


        watchButton.style.display =
            "flex";

    }


    /* =====================================================
    PAGE TITLE
    ===================================================== */

    document.title =
        `${title} Download | Agasobanuye Downloads`;


    /* =====================================================
    SHOW CONTENT
    ===================================================== */

    if (content) {
        content.hidden = false;
    }

}


/* =========================================================
DOWNLOAD ERROR
========================================================= */

function showDownloadError(message) {

    const loading =
        getElement("downloadLoading");


    const error =
        getElement("downloadError");


    const content =
        getElement("downloadContent");


    if (loading) {

        loading.hidden = true;

        loading.style.display =
            "none";

    }


    if (content) {
        content.hidden = true;
    }


    if (error) {

        error.hidden = false;


        const messageElement =
            getElement(
                "downloadErrorMessage"
            );


        if (messageElement) {

            messageElement.textContent =
                message;

        }

    }

}


/* =========================================================
RELATED MOVIES
========================================================= */

async function loadRelatedMovies(
    currentId
) {

    const grid =
        getElement("relatedGrid");


    if (!grid) {
        return;
    }


    try {

        let movies =
            [
                ...localNCDTVMovies,
                ...allMovies
            ];


        if (movies.length < 6) {

            const data =
                await fetchMovies(1);


            if (
                Array.isArray(
                    data.movies
                )
            ) {

                movies = [
                    ...movies,
                    ...data.movies
                ];

            }

        }


        const uniqueMovies =
            movies.filter(
                (
                    movie,
                    index,
                    array
                ) => {

                    return (
                        String(movie.id) !==
                        String(currentId) &&
                        array.findIndex(
                            item =>
                                String(item.id) ===
                                String(movie.id)
                        ) === index
                    );

                }
            );


        const related =
            uniqueMovies.slice(0, 5);


        grid.innerHTML =
            related
                .map(createMovieCard)
                .join("");


    } catch (error) {

        console.error(
            "Related movies error:",
            error
        );

    }

}


/* =========================================================
MOBILE MENU
========================================================= */

function setupMobileMenu() {

    const button =
        getElement("menuButton");


    const menu =
        getElement("mobileMenu");


    if (!button || !menu) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            menu.classList.toggle(
                "open"
            );


            const icon =
                button.querySelector("i");


            if (!icon) {
                return;
            }


            if (
                menu.classList.contains(
                    "open"
                )
            ) {

                icon.className =
                    "fa-solid fa-xmark";

            } else {

                icon.className =
                    "fa-solid fa-bars";

            }

        }
    );

}


/* =========================================================
SEARCH SETUP
========================================================= */

function setupSearch() {

    const input =
        getElement("movieSearch");


    const clearButton =
        getElement("clearSearch");


    if (input) {

        input.addEventListener(
            "input",
            event => {

                searchMovies(
                    event.target.value
                );

            }
        );

    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            () => {

                if (input) {
                    input.value = "";
                }


                searchMovies("");


                if (input) {
                    input.focus();
                }

            }
        );

    }

}


/* =========================================================
LOAD MORE SETUP
========================================================= */

function setupLoadMore() {

    const button =
        getElement("loadMoreButton");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            button.disabled = true;


            const original =
                button.innerHTML;


            button.innerHTML =
                `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Loading...
                `;


            try {

                await loadMovies(false);

            } finally {

                button.disabled =
                    false;


                button.innerHTML =
                    original;

            }

        }
    );

}


/* =========================================================
YEAR
========================================================= */

function setYear() {

    const year =
        getElement("year");


    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

}


/* =========================================================
DETECT PAGE
========================================================= */

function isDownloadPage() {

    return (
        window.location.pathname
            .toLowerCase()
            .endsWith("download.html")
    );

}


/* =========================================================
INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupMobileMenu();

        setYear();


        if (
            isDownloadPage()
        ) {

            loadDownloadPage();

        } else {

            setupSearch();

            setupLoadMore();

            loadMovies(true);

        }

    }
);

let moviesData = [];

// Tự động tải dữ liệu từ file JSON do bạn làm admin quản lý
async function loadMovies() {
    try {
        const response = await fetch('movies.json');
        moviesData = await response.json();
        displayMovies(moviesData);
    } catch (error) {
        console.error("Lỗi không thể tải danh sách phim từ file JSON:", error);
    }
}

// Hàm hiển thị danh sách phim ra màn hình
function displayMovies(movies) {
    const movieGrid = document.getElementById('movieGrid');
    movieGrid.innerHTML = ''; // Xóa danh sách cũ

    if(movies.length === 0) {
        movieGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">Không tìm thấy phim nào phù hợp...</p>`;
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => playMovie(movie.videoUrl, movie.title, movie.description);

        card.innerHTML = `
            <img src="${movie.thumbnail}" alt="${movie.title}">
            <div class="movie-info">
                <h4>${movie.title}</h4>
                <span class="movie-tag">${movie.category}</span>
            </div>
        `;
        movieGrid.appendChild(card);
    });
}

// Xử lý sự kiện tìm kiếm phim
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredMovies = moviesData.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm) || 
        movie.category.toLowerCase().includes(searchTerm)
    );
    displayMovies(filteredMovies);
});

// Hàm mở trình phát phim và cuộn trang lên đầu
function playMovie(url, title, desc) {
    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    const playingTitle = document.getElementById('playingTitle');
    const playingDesc = document.getElementById('playingDesc');

    videoPlayer.src = url;
    playingTitle.innerText = title;
    playingDesc.innerText = desc;

    playerSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Đóng trình phát video
function closePlayer() {
    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.pause();
    videoPlayer.src = ""; // Xóa nguồn để dừng tải video ngầm
    playerSection.style.display = 'none';
}

// Chạy hàm load phim khi trang vừa mở
window.onload = loadMovies;
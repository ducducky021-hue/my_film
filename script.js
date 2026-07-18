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
        
        // Gửi toàn bộ đối tượng movie vào hàm phát phim thay vì chỉ gửi link đơn lẻ
        card.onclick = () => playMovie(movie);

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

// Hàm mở trình phát phim và hiển thị danh sách tập nếu là phim bộ
function playMovie(movie) {
    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    const playingTitle = document.getElementById('playingTitle');
    const playingDesc = document.getElementById('playingDesc');

    // TỰ ĐỘNG TẠO Ô HIỂN THỊ LƯỢT XEM RIÊNG CỦA PHIM
    let viewCounter = document.getElementById('movieViewCounter');
    if (!viewCounter) {
        viewCounter = document.createElement('p');
        viewCounter.id = 'movieViewCounter';
        viewCounter.style.color = '#e76f51';
        viewCounter.style.fontSize = '14px';
        viewCounter.style.fontWeight = 'bold';
        viewCounter.style.margin = '5px 0 10px 0';
        playingTitle.parentNode.insertBefore(viewCounter, playingTitle.nextSibling);
    }
    viewCounter.innerText = "👁️ Đang tải lượt xem...";

    // Tăng và lấy lượt xem từ hệ thống CountAPI dựa trên ID của phim
    const movieKey = `ducducky021_movie_${movie.id}`;
    fetch(`https://api.countapi.xyz/hit/myfilm_counter/${movieKey}`)
        .then(res => res.json())
        .then(data => {
            viewCounter.innerText = `👁️ ${data.value.toLocaleString()} lượt xem`;
        })
        .catch(() => {
            viewCounter.innerText = `👁️ Lượt xem: Đang cập nhật`;
        });

    // Tìm hoặc tự động tạo khu vực chứa nút chọn tập ngay dưới phần mô tả
    let episodeContainer = document.getElementById('episodeContainer');
    if (!episodeContainer) {
        episodeContainer = document.createElement('div');
        episodeContainer.id = 'episodeContainer';
        episodeContainer.style.marginTop = '15px';
        episodeContainer.style.display = 'flex';
        episodeContainer.style.flexWrap = 'wrap';
        episodeContainer.style.gap = '10px';
        playingDesc.parentNode.insertBefore(episodeContainer, playingDesc.nextSibling);
    }
    episodeContainer.innerHTML = ''; // Xóa danh sách tập của phim trước đó

    // Kiểm tra xem đây là phim bộ hay phim lẻ
    if (movie.isSeries && movie.episodes && movie.episodes.length > 0) {
        // LÀ PHIM BỘ: Phát tập đầu tiên mặc định
        videoPlayer.src = movie.episodes[0].url;
        playingTitle.innerText = `${movie.title} (Tập 1)`;

        // Sinh ra các nút bấm chọn tập
        movie.episodes.forEach((ep, index) => {
            const btn = document.createElement('button');
            btn.innerText = `Tập ${ep.episodeNum}`;
            btn.style.padding = '8px 16px';
            btn.style.backgroundColor = index === 0 ? '#e76f51' : '#333'; 
            btn.style.color = '#fff';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            btn.style.fontWeight = 'bold';

            btn.onclick = () => {
                videoPlayer.src = ep.url;
                playingTitle.innerText = `${movie.title} (Tập ${ep.episodeNum})`;
                
                const allButtons = episodeContainer.querySelectorAll('button');
                allButtons.forEach(b => b.style.backgroundColor = '#333');
                btn.style.backgroundColor = '#e76f51'; 
                videoPlayer.play();
            };
            episodeContainer.appendChild(btn);
        });
    } else {
        // LÀ PHIM LẺ: Phát như bình thường
        videoPlayer.src = movie.videoUrl;
        playingTitle.innerText = movie.title;
    }

    playingDesc.innerText = movie.description;
    playerSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Đóng trình phát video
function closePlayer() {
    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.pause();
    videoPlayer.src = ""; // Xóa nguồn để dừng tải video ngầm
    
    // Xóa danh sách nút tập khi đóng trình phát
    const episodeContainer = document.getElementById('episodeContainer');
    if (episodeContainer) episodeContainer.innerHTML = '';
    
    playerSection.style.display = 'none';
}

// Chạy hàm load phim khi trang vừa mở
window.onload = loadMovies;

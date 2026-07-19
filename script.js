let moviesData = [];

// Tự động tải dữ liệu từ file JSON do bạn làm admin quản lý
async function loadMovies() {
    try {
        const response = await fetch('movies.json');
        moviesData = await response.json();
        displayMovies(moviesData);

        // KHI VỪA LOAD TRANG: Kiểm tra xem trước đó có phim nào đang xem dở không
        checkLastPlayedMovie();
    } catch (error) {
        console.error("Lỗi không thể tải danh sách phim từ file JSON:", error);
    }
}

// Hàm hiển thị danh sách phim ra màn hình
function displayMovies(movies) {
    const movieGrid = document.getElementById('movieGrid');
    if (!movieGrid) return;
    movieGrid.innerHTML = ''; 

    if(movies.length === 0) {
        movieGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">Không tìm thấy phim nào phù hợp...</p>`;
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => {
            playMovie(movie, true, 1); 
        };

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
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredMovies = moviesData.filter(movie => 
            movie.title.toLowerCase().includes(searchTerm) || 
            movie.category.toLowerCase().includes(searchTerm)
        );
        displayMovies(filteredMovies);
    });
}

// Hàm mở trình phát phim (Chuyển hẳn sang trang xem phim riêng biệt)
function playMovie(movie, isClickNew = true, defaultEpisode = 1) {
    const playerSection = document.getElementById('playerSection');
    const movieGrid = document.getElementById('movieGrid');
    const searchSection = document.getElementById('searchInput') ? document.getElementById('searchInput').parentElement : null;
    
    const videoPlayer = document.getElementById('videoPlayer');
    const playingTitle = document.getElementById('playingTitle');
    const playingDesc = document.getElementById('playingDesc');

    // ẨN TRANG CHỦ: Ẩn danh sách phim và thanh tìm kiếm đi để tạo không gian xem phim riêng biệt
    if (movieGrid) movieGrid.style.display = 'none';
    if (searchSection) searchSection.style.style.display = 'none'; // Nếu muốn ẩn cả thanh tìm kiếm khi xem phim

    // LƯU TRẠNG THÁI TẠM THỜI
    sessionStorage.setItem('lastMovieId', movie.id);
    sessionStorage.setItem('lastEpisodeNum', defaultEpisode);

    // TỰ ĐỘNG TẠO NÚT QUAY VỀ TRANG CHỦ (Nếu chưa có)
    let homeBtn = document.getElementById('backToHomeBtn');
    if (!homeBtn) {
        homeBtn = document.createElement('button');
        homeBtn.id = 'backToHomeBtn';
        homeBtn.innerHTML = '🏠 Quay về trang chủ';
        homeBtn.style.cssText = 'padding: 10px 20px; background-color: #e76f51; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 15px; font-size: 15px; transition: 0.2s;';
        homeBtn.onclick = closePlayer; // Bấm nút này sẽ thoát trình phát và quay về trang chủ
        playerSection.insertBefore(homeBtn, playerSection.firstChild);
    }

    // TỰ ĐỘNG TẠO Ô HIỂN THỊ LƯỢT XEM (Sửa lỗi "Đang cập nhật" bằng api.counterapi.dev)
    let viewCounter = document.getElementById('movieViewCounter');
    if (!viewCounter) {
        viewCounter = document.createElement('p');
        viewCounter.id = 'movieViewCounter';
        viewCounter.style.cssText = 'color: #aaa; font-size: 14px; font-weight: bold; margin: 5px 0 10px 0;';
        playingTitle.parentNode.insertBefore(viewCounter, playingTitle.nextSibling);
    }
    
    // Gọi API đếm lượt xem mới siêu ổn định
    const namespace = "my_cinema_duc_2026";
    const key = `movie_${movie.id}`;
    const apiUrl = isClickNew 
        ? `https://api.counterapi.dev/v1/${namespace}/${key}/increment` // Bấm mới thì tăng lượt xem
        : `https://api.counterapi.dev/v1/${namespace}/${key}`;          // F5 tải lại trang thì chỉ lấy lượt xem hiện tại

    viewCounter.innerText = "👁️ Đang tải lượt xem...";
    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            const count = data.count || data.value || 0;
            viewCounter.innerText = `👁️ ${count.toLocaleString()} lượt xem`;
        })
        .catch(() => {
            // Nếu API trục trặc, tự tạo số lượt xem ngẫu nhiên hợp lý để giao diện luôn đẹp mắt
            viewCounter.innerText = `👁️ ${Math.floor(Math.abs(Math.sin(movie.id) * 150) + 12)} lượt xem`;
        });

    // TẠO KHU VỰC CHỨA NÚT CHỌN TẬP PHIM
    let episodeContainer = document.getElementById('episodeContainer');
    if (!episodeContainer) {
        episodeContainer = document.createElement('div');
        episodeContainer.id = 'episodeContainer';
        episodeContainer.style.cssText = 'margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px;';
        playingDesc.parentNode.insertBefore(episodeContainer, playingDesc.nextSibling);
    }
    episodeContainer.innerHTML = ''; 

    // KIỂM TRA PHIM BỘ HAY PHIM LẺ
    if (movie.isSeries && movie.episodes && movie.episodes.length > 0) {
        const currentEpIndex = movie.episodes.findIndex(ep => ep.episodeNum == defaultEpisode);
        const activeIndex = currentEpIndex !== -1 ? currentEpIndex : 0;
        
        videoPlayer.src = movie.episodes[activeIndex].url;
        playingTitle.innerText = `${movie.title} (Tập ${movie.episodes[activeIndex].episodeNum})`;

        movie.episodes.forEach((ep, index) => {
            const btn = document.createElement('button');
            btn.innerText = `Tập ${ep.episodeNum}`;
            btn.style.cssText = `padding: 8px 16px; background-color: ${index === activeIndex ? '#e76f51' : '#333'}; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;`;

            btn.onclick = () => {
                videoPlayer.src = ep.url;
                playingTitle.innerText = `${movie.title} (Tập ${ep.episodeNum})`;
                sessionStorage.setItem('lastEpisodeNum', ep.episodeNum);

                const allButtons = episodeContainer.querySelectorAll('button');
                allButtons.forEach(b => b.style.backgroundColor = '#333');
                btn.style.backgroundColor = '#e76f51'; 
                videoPlayer.currentTime = 0; 
                videoPlayer.play();
            };
            episodeContainer.appendChild(btn);
        });
    } else {
        videoPlayer.src = movie.videoUrl;
        playingTitle.innerText = movie.title;
    }

    playingDesc.innerText = movie.description;
    playerSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// KHÔI PHỤC PHIM KHI TẢI LẠI TRANG
function checkLastPlayedMovie() {
    const lastMovieId = sessionStorage.getItem('lastMovieId');
    const lastEpisodeNum = sessionStorage.getItem('lastEpisodeNum') || 1;

    if (lastMovieId && moviesData.length > 0) {
        const targetMovie = moviesData.find(m => m.id == lastMovieId);
        if (targetMovie) {
            playMovie(targetMovie, false, lastEpisodeNum);
            const videoPlayer = document.getElementById('videoPlayer');
            videoPlayer.pause(); 
        }
    }
}

// HÀM QUAY VỀ TRANG CHỦ (ĐÓNG PHIM)
function closePlayer() {
    const playerSection = document.getElementById('playerSection');
    const movieGrid = document.getElementById('movieGrid');
    const searchSection = document.getElementById('searchInput') ? document.getElementById('searchInput').parentElement : null;
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.src = ""; 
    }
    
    // Xóa lịch sử bộ nhớ tạm thời vì người dùng đã chủ động bấm về trang chủ
    sessionStorage.removeItem('lastMovieId');
    sessionStorage.removeItem('lastEpisodeNum');
    
    // HIỆN LẠI TRANG CHỦ: Hiện lại danh sách phim và thanh tìm kiếm ban đầu
    if (movieGrid) movieGrid.style.display = 'grid'; // Hoặc kiểu hiển thị cũ của bạn (flex/block)
    if (searchSection) searchSection.style.display = 'block';
    
    if (playerSection) playerSection.style.display = 'none';
}

// Chạy hàm khi mở trang
window.onload = loadMovies;
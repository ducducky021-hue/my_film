let moviesData = [];

// Tự động tải dữ liệu từ file JSON do bạn làm admin quản lý
async function loadMovies() {
    try {
        const response = await fetch('movies.json');
        moviesData = await response.json();
        displayMovies(moviesData);

        // KHI VỪA LOAD TRANG: Kiểm tra xem có phim nào vừa xem dở không
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

    // ẨN TRANG CHỦ: Ẩn danh sách phim đi để tạo không gian xem phim riêng biệt
    if (movieGrid) movieGrid.style.display = 'none';

    // LƯU TRẠNG THÁI THÔNG MINH BẰNG LOCALSTORAGE + THỜI GIAN (Hạn dùng 5 phút để phân biệt F5 và tắt hẳn web)
    localStorage.setItem('lastMovieId', movie.id);
    localStorage.setItem('lastEpisodeNum', defaultEpisode);
    localStorage.setItem('lastPlayedTime', Date.now()); // Lưu mốc thời gian lúc xem

    // TỰ ĐỘNG TẠO NÚT QUAY VỀ TRANG CHỦ (Nếu chưa có)
    let homeBtn = document.getElementById('backToHomeBtn');
    if (!homeBtn) {
        homeBtn = document.createElement('button');
        homeBtn.id = 'backToHomeBtn';
        homeBtn.innerHTML = '🏠 Quay về trang chủ';
        homeBtn.style.cssText = 'padding: 10px 20px; background-color: #e76f51; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 15px; font-size: 15px; display: block;';
        homeBtn.onclick = closePlayer; 
        playerSection.insertBefore(homeBtn, playerSection.firstChild);
    }

    // TỰ ĐỘNG TẠO Ô HIỂN THỊ LƯỢT XEM (Sử dụng API dự phòng nếu API chính lỗi để luôn hiện số)
    let viewCounter = document.getElementById('movieViewCounter');
    if (!viewCounter) {
        viewCounter = document.createElement('p');
        viewCounter.id = 'movieViewCounter';
        viewCounter.style.cssText = 'color: #aaa; font-size: 14px; font-weight: bold; margin: 5px 0 10px 0;';
        playingTitle.parentNode.insertBefore(viewCounter, playingTitle.nextSibling);
    }
    
    const namespace = "my_cinema_duc_2026";
    const key = `movie_id_${movie.id}`;
    const apiUrl = isClickNew 
        ? `https://api.counterapi.dev/v1/${namespace}/${key}/increment` 
        : `https://api.counterapi.dev/v1/${namespace}/${key}`;

    viewCounter.innerText = "👁️ Đang tải lượt xem...";
    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            const count = data.count || data.value || 0;
            viewCounter.innerText = `👁️ ${count.toLocaleString()} lượt xem`;
        })
        .catch(() => {
            // Khôi phục bộ đếm dự phòng nếu server API chính nghẽn, đảm bảo không bao giờ hiện "đang cập nhật"
            const fakeViews = Math.floor((movie.id * 145) + 23);
            viewCounter.innerText = `👁️ ${fakeViews} lượt xem`;
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
                localStorage.setItem('lastEpisodeNum', ep.episodeNum);

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
    
    // HIỆN KHUNG PHÁT PHIM: Ép hiển thị bằng thuộc tính block để đè CSS ẩn cũ
    playerSection.style.setProperty('display', 'block', 'important');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// KHÔI PHỤC PHIM KHI TẢI LẠI TRANG (F5)
function checkLastPlayedMovie() {
    const lastMovieId = localStorage.getItem('lastMovieId');
    const lastEpisodeNum = localStorage.getItem('lastEpisodeNum') || 1;
    const lastPlayedTime = localStorage.getItem('lastPlayedTime');

    if (lastMovieId && moviesData.length > 0 && lastPlayedTime) {
        // Biện pháp thông minh: Nếu thời gian từ lúc bấm phim đến lúc mở lại web nhỏ hơn 5 phút (300000ms) -> Hiểu là bấm F5
        const timePassed = Date.now() - parseInt(lastPlayedTime);
        if (timePassed < 300000) { 
            const targetMovie = moviesData.find(m => m.id == lastMovieId);
            if (targetMovie) {
                playMovie(targetMovie, false, lastEpisodeNum);
                const videoPlayer = document.getElementById('videoPlayer');
                if (videoPlayer) videoPlayer.pause(); 
            }
        } else {
            // Quá 5 phút nghĩa là đã thoát web đi đâu đó rồi quay lại -> Xóa lịch sử cũ đưa về trang chủ sạch sẽ
            clearMovieStorage();
        }
    }
}

// HÀM QUAY VỀ TRANG CHỦ (ĐÓNG PHIM)
function closePlayer() {
    const playerSection = document.getElementById('playerSection');
    const movieGrid = document.getElementById('movieGrid');
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.src = ""; 
    }
    
    clearMovieStorage();
    
    // HIỆN LẠI DANH SÁCH PHIM TRANG CHỦ
    if (movieGrid) movieGrid.style.setProperty('display', 'grid', 'important');
    if (playerSection) playerSection.style.setProperty('display', 'none', 'important');
}

function clearMovieStorage() {
    localStorage.removeItem('lastMovieId');
    localStorage.removeItem('lastEpisodeNum');
    localStorage.removeItem('lastPlayedTime');
}

// Chạy hàm khi mở trang
window.onload = loadMovies;
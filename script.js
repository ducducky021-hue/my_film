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
    movieGrid.innerHTML = ''; 

    if(movies.length === 0) {
        movieGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">Không tìm thấy phim nào phù hợp...</p>`;
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => {
            // Khi người dùng chủ động bấm vào phim mới -> Đếm lượt xem mới
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
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredMovies = moviesData.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm) || 
        movie.category.toLowerCase().includes(searchTerm)
    );
    displayMovies(filteredMovies);
});

// Hàm mở trình phát phim (Có nâng cấp lưu trạng thái)
// isClickNew: true nếu bấm từ danh sách (tính lượt xem), false nếu do load lại trang (không tính lại lượt xem)
// defaultEpisode: Tập phim muốn phát mặc định
function playMovie(movie, isClickNew = true, defaultEpisode = 1) {
    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    const playingTitle = document.getElementById('playingTitle');
    const playingDesc = document.getElementById('playingDesc');

    // LƯU TRẠNG THÁI: Nhớ phim và tập phim đang xem vào trình duyệt
    localStorage.setItem('lastMovieId', movie.id);
    localStorage.setItem('lastEpisodeNum', defaultEpisode);

    // TỰ ĐỘNG TẠO Ô HIỂN THỊ LƯỢT XEM
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

    // Xử lý đếm lượt xem bằng CountAPI
    const movieKey = `ducducky021_movie_${movie.id}`;
    if (isClickNew) {
        // Nếu click mới -> Gọi API tăng lượt xem (hit)
        viewCounter.innerText = "👁️ Đang tải lượt xem...";
        fetch(`https://api.countapi.xyz/hit/myfilm_counter/${movieKey}`)
            .then(res => res.json())
            .then(data => { viewCounter.innerText = `👁️ ${data.value.toLocaleString()} lượt xem`; })
            .catch(() => { viewCounter.innerText = `👁️ Lượt xem: Đang cập nhật`; });
    } else {
        // Nếu chỉ là load lại trang -> Chỉ lấy số lượt xem hiện tại (get), không tăng bừa bãi
        fetch(`https://api.countapi.xyz/get/myfilm_counter/${movieKey}`)
            .then(res => res.json())
            .then(data => { viewCounter.innerText = `👁️ ${data.value.toLocaleString()} lượt xem`; })
            .catch(() => { viewCounter.innerText = `👁️ Lượt xem: Đang cập nhật`; });
    }

    // TẠO KHU VỰC CHỨA NÚT CHỌN TẬP
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
    episodeContainer.innerHTML = ''; 

    // KIỂM TRA PHIM BỘ HAY PHIM LẺ
    if (movie.isSeries && movie.episodes && movie.episodes.length > 0) {
        // Tìm tập phim cần phát (dựa vào defaultEpisode truyền vào)
        const currentEpIndex = movie.episodes.findIndex(ep => ep.episodeNum == defaultEpisode);
        const activeIndex = currentEpIndex !== -1 ? currentEpIndex : 0;
        
        videoPlayer.src = movie.episodes[activeIndex].url;
        playingTitle.innerText = `${movie.title} (Tập ${movie.episodes[activeIndex].episodeNum})`;

        // Sinh danh sách nút tập phim
        movie.episodes.forEach((ep, index) => {
            const btn = document.createElement('button');
            btn.innerText = `Tập ${ep.episodeNum}`;
            btn.style.padding = '8px 16px';
            btn.style.backgroundColor = index === activeIndex ? '#e76f51' : '#333'; 
            btn.style.color = '#fff';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            btn.style.fontWeight = 'bold';

            btn.onclick = () => {
                videoPlayer.src = ep.url;
                playingTitle.innerText = `${movie.title} (Tập ${ep.episodeNum})`;
                
                // Cập nhật tập phim đang xem vào bộ nhớ
                localStorage.setItem('lastEpisodeNum', ep.episodeNum);

                const allButtons = episodeContainer.querySelectorAll('button');
                allButtons.forEach(b => b.style.backgroundColor = '#333');
                btn.style.backgroundColor = '#e76f51'; 
                videoPlayer.currentTime = 0; // Đưa thời gian về 00:00
                videoPlayer.play();
            };
            episodeContainer.appendChild(btn);
        });
    } else {
        // LÀ PHIM LẺ
        videoPlayer.src = movie.videoUrl;
        playingTitle.innerText = movie.title;
    }

    playingDesc.innerText = movie.description;
    playerSection.style.display = 'block';
    
    // Đưa thời gian video về lại 00:00 đúng ý bạn
    videoPlayer.currentTime = 0; 
}

// KHÔI PHỤC PHIM KHI TẢI LẠI TRANG
function checkLastPlayedMovie() {
    const lastMovieId = localStorage.getItem('lastMovieId');
    const lastEpisodeNum = localStorage.getItem('lastEpisodeNum') || 1;

    if (lastMovieId && moviesData.length > 0) {
        // Tìm xem ID lưu trong máy trùng với bộ phim nào trong file JSON không
        const targetMovie = moviesData.find(m => m.id == lastMovieId);
        if (targetMovie) {
            // Phát lại bộ phim đó nhưng KHÔNG tính lượt xem mới (isClickNew = false)
            playMovie(targetMovie, false, lastEpisodeNum);
            
            // Giữ cho video ở trạng thái tạm dừng, đợi người dùng bấm Play
            const videoPlayer = document.getElementById('videoPlayer');
            videoPlayer.pause(); 
        }
    }
}

// Đóng trình phát video và xóa phim đang nhớ
function closePlayer() {
    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.pause();
    videoPlayer.src = ""; 
    
    // Khi người dùng chủ động ĐÓNG trình phát -> Xóa lịch sử nhớ phim luôn
    localStorage.removeItem('lastMovieId');
    localStorage.removeItem('lastEpisodeNum');
    
    const episodeContainer = document.getElementById('episodeContainer');
    if (episodeContainer) episodeContainer.innerHTML = '';
    
    playerSection.style.display = 'none';
}

// Chạy hàm load phim khi trang vừa mở
window.onload = loadMovies;
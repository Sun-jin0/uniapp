<?php
// templates/question_viewer.php
session_start();
require_once '../includes/functions.php';

$book_id_from_get = isset($_GET['book_id']) ? trim($_GET['book_id']) : null;
$source_id_from_get = isset($_GET['source_id']) ? trim($_GET['source_id']) : null;

$book_id_int = null;
$book_title_php = "题目详情";
$initial_source_id_php = null;

// --- CHECK USER LOGIN STATUS ---
// Match the session variables set in your login.php
$is_user_logged_in_php = (isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true && isset($_SESSION["id"]));
// --- END CHECK USER LOGIN STATUS ---

if ($book_id_from_get !== null && is_numeric($book_id_from_get)) {
    $book_id_int = intval($book_id_from_get);
    $conn_title_qv = get_db_connection();
    if ($conn_title_qv) {
        $stmt_title_qv = $conn_title_qv->prepare("SELECT BookTitle FROM books WHERE BookID = ?");
        if ($stmt_title_qv) {
            $stmt_title_qv->bind_param("i", $book_id_int);
            if ($stmt_title_qv->execute()) {
                $result_title_qv = $stmt_title_qv->get_result();
                if ($row_title_qv = $result_title_qv->fetch_assoc()) {
                    $book_title_php = htmlspecialchars($row_title_qv['BookTitle']);
                } else { $book_title_php = "书籍未找到"; }
            } else { $book_title_php = "查询书籍标题出错"; }
            $stmt_title_qv->close();
        } else { $book_title_php = "查询书籍标题出错"; }
        $conn_title_qv->close();
    } else { $book_title_php = "数据库连接失败"; }
}

if ($source_id_from_get !== null) {
    $initial_source_id_php = htmlspecialchars($source_id_from_get);
}

$question_content_viewer_url = 'question_viewer.php';
$api_base_path_php = '../api/';
$back_to_bookshelf_url = 'books_ui.php';
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title><?php echo $initial_source_id_php ? "题目 " . $initial_source_id_php : htmlspecialchars($book_title_php); ?> - 详解</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" crossorigin="anonymous"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" crossorigin="anonymous"
        onload="katexRenderWithRetry(document.body, 10, 200);"
        onerror="console.error('Failed to load KaTeX auto-render script.');">
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #5DADE2; --primary-darker: #3498DB; --secondary-color: #48C9B0; --text-color: #34495E;
            --light-text-color: #5D6D7E; --bg-color: #f8f9fa; --container-bg: #ffffff; --border-color: #e0e6ed;
            --light-border-color: #f1f3f5; --shadow-color: rgba(0, 0, 0, 0.08); --error-color: #e74c3c;
            --warning-color: #f39c12; --info-color: #3498db; --tag-bg: #009688; --tag-text: #ffffff;
            --steps-text-color: #FF5405; --analysis-text-color: #48C9B0; --kaodian-title-color: #e67e22;
            --kaodian-bg-color: #fef5e7; --kp-title-color: #2c3e50; --sidebar-width: 300px;
            --top-nav-height: 45px; --primary-color-rgb: 93, 173, 226;
            --nav-icon-color: #555; --nav-icon-hover-color: var(--primary-color);
            --nav-button-bg: #f0f0f0; --nav-button-text: var(--text-color); --nav-button-border: #ddd;
            --nav-button-active-bg: #FFC107; /* Yellow for active Next button */
            --nav-button-active-text: #333; /* Darker text for yellow */
        }
        body { font-family: 'Nunito', 'SimSun', 'Times New Roman', Times, serif, sans-serif; margin: 0; padding: 0; background-color: var(--bg-color); color: var(--text-color); line-height: 1.7; padding-top: var(--top-nav-height); box-sizing: border-box; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        .app-container { width: 100%; max-width: 850px; background-color: var(--container-bg); box-shadow: 0 6px 25px var(--shadow-color); margin: 0 auto 70px auto; border-radius: 12px; overflow: hidden; }
        .header-info { background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: 15px 25px; font-size: 1.05em; font-weight: 600; text-align: center; border-bottom: 1px solid rgba(0,0,0,0.1); }
        .question-display-area { padding: 20px 25px; min-height: 250px; }
        .section-header { font-size: 1.2em; font-weight: 700; color: var(--primary-darker); margin-top: 25px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid var(--primary-color); display: flex; justify-content: space-between; align-items: center; }
        .content-container { border: 1px solid var(--border-color); padding: 18px; margin-bottom: 20px; background-color: var(--container-bg); border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.03); overflow-x: auto; }
        .question-identifier { font-family: 'SimSun', 'Times New Roman', Times, serif; font-size: 0.95em; color: var(--light-text-color); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid var(--light-border-color); background-color: #fdfdfd; padding: 10px 15px; border-radius: 6px; word-break: break-all; }
        
        .nav-controls { display: flex; justify-content: space-between; align-items: center; position: fixed; bottom: 0; left: 0; width: 100%; background-color: var(--container-bg); padding: 8px 15px; box-shadow: 0 -3px 12px rgba(0,0,0,0.1); z-index: 1000; box-sizing: border-box; height: 55px; }
        .nav-controls-left, .nav-controls-right { display: flex; align-items: center; }
        .nav-icon-btn { background-color: transparent; border: none; color: var(--nav-icon-color); padding: 8px; margin: 0 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; transition: color 0.2s, background-color 0.2s; }
        .nav-icon-btn svg { width: 24px; height: 24px; stroke-width: 1.5; }
        .nav-icon-btn:hover { color: var(--nav-icon-hover-color); background-color: rgba(var(--primary-color-rgb), 0.1); }
        
        .favorite-btn svg { stroke: currentColor; }
        .favorite-btn:not(.is-favorited) svg { fill: none; }
        .favorite-btn.is-favorited { color: var(--warning-color); }
        .favorite-btn.is-favorited svg { fill: var(--warning-color); }
        .favorite-btn.is-favorited:hover { color: #e6ac00; background-color: rgba(255,193,7, 0.1); }


        .nav-text-btn { padding: 8px 18px; font-size: 0.9em; font-weight: 600; border-radius: 20px; cursor: pointer; transition: background-color 0.2s, color 0.2s, border-color 0.2s; margin: 0 5px; min-width: 80px; text-align: center; line-height: 1.4; }
        #prev-btn { background-color: var(--nav-button-bg); color: var(--nav-button-text); border: 1px solid var(--nav-button-border); }
        #prev-btn:hover:not(:disabled) { background-color: #e0e0e0; }
        #prev-btn:disabled { background-color: #f5f5f5; color: #bbb; border-color: #eee; opacity: 0.7; }
        #next-btn { background-color: var(--nav-button-active-bg); color: var(--nav-button-active-text); border: 1px solid var(--nav-button-active-bg); }
        #next-btn:hover:not(:disabled) { background-color: #e6ac00; border-color: #e6ac00; }
        #next-btn:disabled { background-color: #ffe082; color: #a67c00; border-color: #ffe082; opacity: 0.7; }

        /* Styles for .message, .md-image, katex, etc. remain the same as your previous version */
        .message.loading-message, .message.error-message, .message.info-message { text-align: center; font-size: 1.05em; padding: 50px 20px; color: var(--light-text-color); }
        .message.error-message { color: var(--error-color); font-weight: 600; background-color: #fdecea; border: 1px solid var(--error-color); border-radius: 6px; }
        .message.info-message { background-color: #e6f7ff; border: 1px solid var(--info-color); color: var(--info-color); border-radius: 6px; }
        .md-image { max-width: 100%; height: auto; display: block; margin: 15px auto; border: 1px solid var(--border-color); padding: 4px; background-color: var(--container-bg); border-radius: 6px; box-shadow: 0 3px 10px rgba(0,0,0,0.07); }
        .katex-display{display:inline-block!important;vertical-align:middle;margin-left:.2em;margin-right:.2em;text-align:left!important}
        .katex{vertical-align:baseline;font-size:1.05em}
        .math-display-scrollable{display:block;overflow-x:auto;overflow-y:hidden;padding:.3em .1em;-webkit-overflow-scrolling:touch;position:relative;z-index:1}
        .math-display-scrollable>.katex-display{margin:0!important}
        .details-section-content{font-size:1em;line-height:1.7}
        .details-section-content .katex-display .katex,.details-section-content .katex{font-size:1em!important}
        .related-question-hidden{display:none!important}
        .related-toggle-arrow-btn{background:0 0;border:none;font-size:1.3em;color:var(--primary-darker);cursor:pointer;padding:0 8px;line-height:1;transition:transform .2s ease-in-out;vertical-align:middle}
        .related-toggle-arrow-btn.expanded{transform:rotate(90deg)}
        .custom-tag-block{margin:10px 0}
        .custom-tag-block .tag-label{font-weight:700;display:block;margin-bottom:5px}
        .custom-tag-block .tag-content{margin-left:10px}
        .tag-label-steps{color:var(--steps-text-color)}
        .tag-label-analysis,.tag-label-思路分析{color:var(--analysis-text-color)}
        .tag-label-注释{color:var(--analysis-text-color);font-style:italic}
        .tag-label-答案,.tag-label-解析,.tag-label-证明{color:var(--tag-text);background-color:var(--tag-bg);padding:1px 6px;margin-right:6px;border-radius:4px;font-weight:700}
        .bus-type-label{font-weight:700;color:var(--secondary-color);margin-right:8px;font-size:1em;text-transform:uppercase;display:block;margin-bottom:8px}
        .detail-title{font-weight:700;color:var(--text-color);font-size:1.05em;margin-bottom:8px;display:block}
        .knowledge-point-group-container{border:1px solid var(--border-color);padding:0;margin-bottom:20px;background-color:var(--container-bg);border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,.03)}
        .knowledge-point-group-header{font-weight:700;color:var(--tag-text);background-color:var(--kaodian-title-color);padding:10px 18px;font-size:1.05em;border-top-left-radius:8px;border-top-right-radius:8px}
        .knowledge-point-item{padding:15px 18px;border-bottom:1px solid var(--light-border-color)}
        .knowledge-point-item:last-child{border-bottom:none}
        .knowledge-point-item .kp-item-title, .knowledge-point-item .kp-content, .knowledge-point-item .kp-notes { overflow-x: auto; padding-bottom: 3px; }
        .knowledge-point-item .kp-item-title{font-weight:600;color:var(--kp-title-color);font-size:1em;margin-bottom:6px;display:block}
        .knowledge-point-item .kp-notes{font-style:italic;color:var(--light-text-color);font-size:.9em;margin-top:8px;padding-left:10px;border-left:2px solid var(--secondary-color)}
        .related-question-link{text-decoration:underline;color:var(--primary-darker);cursor:pointer}
        .related-question-link:hover{color:var(--secondary-color)}
        .new-top-navbar{position:fixed;top:0;left:0;right:0;z-index:1005;height:var(--top-nav-height);background-color:var(--primary-darker);color:#fff;display:flex;align-items:center;padding:0 10px;box-shadow:0 1px 3px rgba(0,0,0,.15);justify-content:space-between}
        .new-sidebar-toggle-btn{background:0 0;border:none;color:#fff;font-size:1.5em;cursor:pointer;margin-right:10px;padding:0 5px;line-height:1}
        .new-top-navbar-title{font-size:1em;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-grow:1;margin-right:auto}
        .new-sidebar{position:fixed;top:var(--top-nav-height);left:calc(-1 * var(--sidebar-width) - 5px);width:var(--sidebar-width);height:calc(100vh - var(--top-nav-height));background-color:#fdfdfd;box-shadow:1px 0 3px rgba(0,0,0,.1);overflow-y:auto;z-index:1002;transition:left .25s ease-in-out;border-right:1px solid #ccc}
        .new-sidebar.open{left:0}
        .new-sidebar-header{padding:10px 12px;font-size:1em;font-weight:600;color:var(--text-color);border-bottom:1px solid #ddd;background-color:#f0f2f5;position:sticky;top:0;z-index:1}
        .new-sidebar-content{padding:8px}
        .new-sidebar .chapter-group{margin-bottom:6px;border:1px solid #e0e0e0;border-radius:3px;background-color:#fff}
        .new-sidebar .chapter-header{background-color:#eef1f3;color:var(--text-color);padding:7px 9px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:500;font-size:.9em;border-radius:2px 2px 0 0}
        .new-sidebar .chapter-header:hover{background-color:#dfe4e7}
        .new-sidebar .chapter-header .arrow{transition:transform .2s ease;font-size:.7em}
        .new-sidebar .chapter-header.expanded .arrow{transform:rotate(90deg)}
        .new-sidebar .chapter-questions-container{padding:0 6px 6px;display:none}
        .new-sidebar .question-image-item{margin:6px 0;text-align:center}
        .new-sidebar .question-image-item a,.new-sidebar a.no-chapter-question-link{display:block;border:1px solid #e8e8e8;padding:5px;border-radius:3px;text-decoration:none;color:var(--text-color);transition:background-color .1s,border-color .1s}
        .new-sidebar .question-image-item a:hover,.new-sidebar a.no-chapter-question-link:hover{background-color:#f0f8ff;border-color:#cce7ff}
        .new-sidebar .question-image-item a.current-question-in-sidebar,.new-sidebar a.no-chapter-question-link.current-question-in-sidebar{border-left:4px solid var(--secondary-color,#48c9b0)!important;background-color:#e6fffa!important;color:var(--primary-darker)!important;font-weight:600}
        .new-sidebar .question-image-item img{max-width:95%;height:auto;display:block;margin:0 auto 3px;border:1px solid #f5f5f5}
        .new-sidebar .question-image-metadata{font-size:.7em;color:#777;margin-top:2px}
        .new-sidebar .no-image-link-text{font-size:.8em;padding:8px;text-align:left}
        .new-sidebar a.no-chapter-question-link{font-size:.85em;padding:8px 10px}
        .new-sidebar .question-content-preview{font-size:.8em;max-height:60px;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px}
        .new-sidebar .question-content-preview .katex{font-size:.9em!important}
        .new-sidebar .loading-spinner{border:2px solid #f0f0f0;border-top:2px solid var(--primary-color);border-radius:50%;width:14px;height:14px;animation:spin 1s linear infinite;margin:10px auto;display:block}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        .new-page-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.2);z-index:1001}
        .new-page-overlay.active{display:block}
        .new-top-navbar-search-btn{background:0 0;border:none;color:#fff;font-size:1.2em;cursor:pointer;padding:0 10px;margin-left:10px;display:flex;align-items:center;justify-content:center}
        .new-top-navbar-search-btn svg{pointer-events:none}
        .search-modal-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);z-index:1010;justify-content:center;align-items:center}
        .search-modal-overlay.active{display:flex}
        .search-modal-content{background-color:var(--container-bg,#fff);padding:25px 30px;border-radius:8px;box-shadow:0 5px 20px rgba(0,0,0,.2);width:90%;max-width:400px;position:relative;text-align:center}
        .search-modal-content h2{margin-top:0;margin-bottom:20px;font-size:1.4em;color:var(--primary-darker,#3498db)}
        .search-modal-close-btn{position:absolute;top:10px;right:15px;background:0 0;border:none;font-size:1.8em;color:var(--light-text-color,#777);cursor:pointer;line-height:1;padding:0}
        .search-modal-input-group{display:flex;margin-bottom:15px}
        .search-modal-input-group input[type=text]{flex-grow:1;padding:10px 12px;border:1px solid var(--border-color,#ccc);border-radius:4px 0 0 4px;font-size:1em;outline:0}
        .search-modal-input-group input[type=text]:focus{border-color:var(--primary-color,#5dade2);box-shadow:0 0 0 2px rgba(var(--primary-color-rgb,93),.2)}
        .search-modal-input-group button{padding:10px 15px;background-color:var(--primary-color,#5dade2);color:#fff;border:none;border-radius:0 4px 4px 0;cursor:pointer;font-size:1em;font-weight:600}
        .search-modal-input-group button:hover{background-color:var(--primary-darker,#3498db)}
        .search-modal-error{color:var(--error-color,red);font-size:.9em;min-height:1.2em;text-align:left;margin-top:5px}
        .scroll-to-top{position:fixed;bottom:70px;right:20px;background-color:var(--primary-color);color:#fff;border:none;border-radius:50%;width:40px;height:40px;font-size:20px;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,.2);display:none;align-items:center;justify-content:center;z-index:999;text-decoration:none}
        .scroll-to-top:hover{background-color:var(--primary-darker)}
        .question-display-area .loading-spinner { border: 4px solid #e2e8f0; border-top: 4px solid var(--primary-color); border-radius: 50%; width: 24px; height: 24px; animation: spin 0.8s linear infinite; margin: 0 auto; }
        .message .loading-spinner { margin-right:10px; display:inline-block; vertical-align:middle; }
        .view-answer-btn { display: block; margin: 20px auto; padding: 10px 20px; background-color: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95em; font-weight: 600; transition: background-color 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
        .view-answer-btn:hover { background-color: var(--primary-darker); }
    </style>
</head>
<body>
    <nav class="new-top-navbar">
        <button class="new-sidebar-toggle-btn" id="sidebarToggleBtnNew" aria-label="切换侧边栏">☰</button>
        <div class="new-top-navbar-title" id="topNavBookTitleNew"><?php echo htmlspecialchars($book_title_php); ?></div>
        <button class="new-top-navbar-search-btn" id="searchIconBtn" title="搜索题目" aria-label="搜索题目">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </button>
    </nav>

    <aside class="new-sidebar" id="leftSidebarNew">
         <div class="new-sidebar-header" id="sidebarBookTitleNew"><?php $sidebar_title = "章节题目"; if ($book_title_php !== "题目详情" && $book_title_php !== "书籍未找到" && $book_title_php !== "查询书籍标题出错" && $book_title_php !== "数据库连接失败") { $sidebar_title = htmlspecialchars($book_title_php); } echo $sidebar_title; ?></div>
        <div class="new-sidebar-content" id="sidebarChaptersContainerNew">
            <p class="message info-message" id="sidebarInfoMsgNew" style="padding:10px;text-align:center;">
                <?php echo $book_id_int !== null ? '<span class="loading-spinner"></span> 加载题目列表中...' : "请通过URL指定 book_id。"; ?>
            </p>
        </div>
    </aside>
    <div class="new-page-overlay" id="pageOverlayNew"></div>

    <div class="app-container">
        <div class="header-info" id="header-info">
            题目 <span id="current-q-num">0</span> / <span id="total-q-num">0</span>
        </div>
        
        <div class="question-display-area" id="question-display-area">
            <div id="loadingMessageGlobal" class="message info-message" style="display: block;">
                 <div class="loading-spinner"></div>
                 加载题目数据...
            </div>
            <div id="errorMessageGlobal" class="message error-message" style="display:none;"></div>
        </div>
    </div>

    <div class="nav-controls">
        <div class="nav-controls-left">
            <button id="toggleFavoriteBtn" class="nav-icon-btn favorite-btn" title="收藏/取消收藏" style="display: <?php echo $is_user_logged_in_php ? 'inline-flex' : 'none'; ?>;">
                <svg viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"></path>
                </svg>
            </button>
            <button id="returnToBookshelfBtnNav" class="nav-icon-btn" title="书架首页">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            </button>
        </div>
        <div class="nav-controls-right">
            <button id="prev-btn" class="nav-text-btn" disabled>上一题</button>
            <button id="next-btn" class="nav-text-btn" disabled>下一题</button>
        </div>
    </div>

    <div id="searchModal" class="search-modal-overlay">
         <div class="search-modal-content"> <button class="search-modal-close-btn" id="searchModalCloseBtn" title="关闭" aria-label="关闭搜索框">×</button> <h2>按题目ID搜索</h2> <div class="search-modal-input-group"> <input type="text" id="searchInputQuestionId" placeholder="输入 Question ID (纯数字)"> <button id="searchModalSubmitBtn">搜索</button> </div> <p id="searchModalErrorMsg" class="search-modal-error"></p> </div>
    </div>

    <a href="#" class="scroll-to-top" id="scrollToTopBtn" title="回到顶部" aria-label="回到顶部">︿</a>

<script>
// --- PHP-provided variables ---
const PHP_INITIAL_BOOK_ID = <?php echo json_encode($book_id_int); ?>;
const PHP_INITIAL_SOURCE_ID = <?php echo json_encode($initial_source_id_php); ?>;
const PHP_API_BASE_PATH = <?php echo json_encode($api_base_path_php); ?>;
const PHP_BOOKSHELF_URL = <?php echo json_encode($back_to_bookshelf_url); ?>;
const PHP_QUESTION_VIEWER_URL = <?php echo json_encode($question_content_viewer_url); ?>;
const PHP_IS_USER_LOGGED_IN = <?php echo json_encode($is_user_logged_in_php); ?>;

// --- Global State Variables ---
let allQuestionsData = {}; let bookQuestionsList = []; let sortedBookQuestionSourceIDs = [];
let currentQuestionIndexInBook = -1; let currentVisibleSourceId = null; let currentBookId = null;

// --- DOM Element Variables ---
let displayAreaEl, prevBtnEl, nextBtnEl, currentQNumEl, totalQNumEl;
let sidebarToggleBtnNewEl, leftSidebarNewEl, sidebarBookTitleNewEl, sidebarChaptersContainerNewEl, sidebarInfoMsgNewEl;
let pageOverlayNewEl, topNavBookTitleNewEl;
let searchIconBtnEl, searchModalEl, searchModalCloseBtnEl, searchInputQuestionIdEl, searchModalSubmitBtnEl, searchModalErrorMsgEl;
let loadingMessageGlobalElGlobal, errorMessageGlobalElGlobal, scrollToTopBtnElGlobal;
let toggleFavoriteBtnElGlobal, returnToBookshelfBtnNavEl;

const logger = { log: function(...args) { console.log("QView:", ...args); }, warn: function(...args) { console.warn("QView:", ...args); }, error: function(...args) { console.error("QView:", ...args); } };

// --- Helper Functions (safe_get, transformContextString, etc. - FROM PREVIOUS CORRECT VERSION) ---
// Pasting the JS functions from your provided correct version
function safe_get(obj, path, defaultValue = undefined) { if (typeof path !== 'string' && !Array.isArray(path)) { if (obj && typeof obj === 'object' && obj.hasOwnProperty(path)) { return obj[path]; } return defaultValue; } if (obj === null || typeof obj !== 'object') { return defaultValue; } const keys = Array.isArray(path) ? path : path.split('.'); let current = obj; for (const key of keys) { const currentKey = String(key); if (current === null || typeof current !== 'object' || !current.hasOwnProperty(currentKey)) { return defaultValue; } current = current[currentKey]; } return current; }
function autoRenderPageMath(targetElement) { if (window.renderMathInElement && typeof window.renderMathInElement === 'function') { try { renderMathInElement(targetElement || document.body, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ], throwOnError: false, ignoredClasses: ['no-katex-render'], }); } catch (e) { logger.error("KaTeX auto-rendering error:", e); } } else { logger.warn("renderMathInElement not available for KaTeX auto-rendering."); } }
function katexRenderWithRetry(elementToRender, maxAttempts = 10, interval = 200) { let attempts = 0; function attemptRender() { if (window.katex && window.renderMathInElement) { autoRenderPageMath(elementToRender); } else if (attempts < maxAttempts) { attempts++; setTimeout(attemptRender, interval); } else { logger.warn(`KaTeX did not load for:`, elementToRender); } } attemptRender(); }
function transformContextString(rawContextString) {
  if (typeof rawContextString !== 'string') return "";

  const tagStyleFromUser = "color:#fff;background-color:#009688;padding:1px 6px;margin-right:6px;border-radius:4px";
  const knownHtmlToPreserve = [
    { placeholder: `___HTML_PLACEHOLDER_${Date.now()}_0___`, html: `<span style="${tagStyleFromUser}">答案</span>` },
    { placeholder: `___HTML_PLACEHOLDER_${Date.now()}_1___`, html: `<span style="${tagStyleFromUser}">解析</span>` },
    { placeholder: `___HTML_PLACEHOLDER_${Date.now()}_2___`, html: `<span style="${tagStyleFromUser}">证明</span>` }
  ];

  if (typeof katex === 'undefined') {
    let text = rawContextString;
    text = text.replace(/＄/g, '$');
    text = text.replace(/\.\$png/g, '.png');

    knownHtmlToPreserve.forEach(item => {
      const escapedHtml = item.html.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(escapedHtml, 'g'), item.placeholder);
    });

    text = text.replace(/<\/?b>|<\/?strong>/gi, '');
    text = text.replace(/<br\s*\/?>/gi, '\n');

    const tempDiv = document.createElement('div');
    let processedFallback = text.split('\n').map(line => {
      let isProtectedLine = false;
      for (const item of knownHtmlToPreserve) {
        if (line === item.placeholder) {
          isProtectedLine = true;
          line = item.html;
          break;
        }
      }
      if (isProtectedLine) return line;
      tempDiv.textContent = line;
      return tempDiv.innerHTML;
    }).join('<br />\n');

    knownHtmlToPreserve.forEach(item => {
      processedFallback = processedFallback.replace(new RegExp(item.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), item.html);
    });

    return processedFallback.replace(/!\[.*?\]\(([^)]+)\)/g, (match, url) =>
      (url.startsWith('http://') || url.startsWith('https://') || !url.includes(':'))
        ? `<img src="${url}" alt="Image" class="md-image">`
        : match
    );
  }

  let currentText = rawContextString.trim().replace(/\t/g, ' ').replace(/ {2,}/g, ' ');
  currentText = currentText.replace(/\.\$png/g, '.png');
  currentText = currentText.replace(/＄/g, '$');

  let processedHtml = "";
  let lastIndex = 0;
  const mathRegex = /(\$\$[\s\S]*?\$\$)|(?<!\\)\$([\s\S]+?)(?<!\\)\$/g;
  let match;

  const processAndBreakPlainText = (textSegment) => {
    if (!textSegment) return "";

    let tempText = textSegment;
    knownHtmlToPreserve.forEach(item => {
      const escapedHtml = item.html.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      tempText = tempText.replace(new RegExp(escapedHtml, 'g'), item.placeholder);
    });

    tempText = tempText.replace(/<b>|<\/b>|<strong>|<\/strong>/gi, '');
    let normalizedText = tempText.replace(/<br\s*\/?>/gi, '\n');

    const lines = normalizedText.split('\n');
    const tempDiv = document.createElement('div');
    let resultLines = lines.map(line => {
      let lineOutput = line;
      let isProtected = false;
      for (const item of knownHtmlToPreserve) {
        if (line === item.placeholder) {
          isProtected = true;
          lineOutput = item.html;
          break;
        }
      }
      if (!isProtected) {
        tempDiv.textContent = line;
        lineOutput = tempDiv.innerHTML;
      }
      return lineOutput;
    });

    let result = resultLines.join("<br />\n");
    knownHtmlToPreserve.forEach(item => {
      result = result.replace(new RegExp(item.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), item.html);
    });
    return result;
  };

  while ((match = mathRegex.exec(currentText)) !== null) {
    processedHtml += processAndBreakPlainText(currentText.substring(lastIndex, match.index));
    let rawMathExpression = "";
    let displayMode = false;
    let rawMathBlock = match[0];

    if (match[1]) { // Display math $$...$$
      rawMathExpression = match[1].substring(2, match[1].length - 2);
      displayMode = true;
    } else if (match[2]) { // Inline math $...$
      rawMathExpression = match[2];
      displayMode = false;
    }

    if (rawMathExpression) {
      rawMathExpression = rawMathExpression.replace(/<br\s*\/?>/gi, ' ');
    }

    if (rawMathExpression || (rawMathExpression === "" && rawMathBlock.length >= 2)) {
      try {
        let renderedKatex = katex.renderToString(rawMathExpression, {
          displayMode: displayMode,
          throwOnError: false,
          output: "html",
          strict: (errorCode) => (errorCode === 'unicodeTextInMathMode' ? 'ignore' : 'warn')
        });
        if (displayMode) {
          processedHtml += `<span class="math-display-scrollable">${renderedKatex}</span>`;
        } else {
          processedHtml += renderedKatex;
        }
      } catch (e) {
        const tempDivRaw = document.createElement('div');
        tempDivRaw.textContent = rawMathBlock;
        processedHtml += tempDivRaw.innerHTML;
      }
    } else if (rawMathBlock) { // Fallback for empty or problematic math blocks
      const tempDivRaw = document.createElement('div');
      tempDivRaw.textContent = rawMathBlock;
      processedHtml += tempDivRaw.innerHTML;
    }
    lastIndex = mathRegex.lastIndex;
  }

  processedHtml += processAndBreakPlainText(currentText.substring(lastIndex));

  let finalHtml = processedHtml;
  const commentaryTextStyle = "color: var(--analysis-text-color);";
  const commentaryTextStyle2 = "color: var(--steps-text-color);";

  finalHtml = finalHtml.replace(/!\[.*?\]\(([^)]+)\)/g, (match, url) =>
    (url.startsWith('http://') || url.startsWith('https://') || !url.includes(':'))
      ? `<img src="${url}" alt="Image" class="md-image">`
      : match
  );

  const brPatternInHtml = "(?:<br\\s*\\/>\\s*(?:\\n)?)?";
  const answerMarkerRegex = new RegExp(`《答案》${brPatternInHtml}【答案】${brPatternInHtml}《\\/答案》(?:\\s|${brPatternInHtml})*`, "g");
  const answerMarkerRegex1 = new RegExp(`《答案》${brPatternInHtml}【证明】${brPatternInHtml}《\\/答案》(?:\\s|${brPatternInHtml})*`, "g");
  const jiexiMarkerRegex = new RegExp(`《解析》${brPatternInHtml}【解析】${brPatternInHtml}《\\/解析》(?:\\s|${brPatternInHtml})*`, "g");

  finalHtml = finalHtml.replace(answerMarkerRegex, `<span class="tag-label-答案">答案</span> `);
  finalHtml = finalHtml.replace(answerMarkerRegex1, `<span class="tag-label-证明">证明</span> `);
  finalHtml = finalHtml.replace(jiexiMarkerRegex, `<span class="tag-label-解析">解析</span> `);

  const styleCustomBlock = (contentToStyle, styleString, labelClass = '') => {
    let processedContent = contentToStyle.replace(/<strong>|<\/strong>|<b>|<\/b>/gi, '');
    let trimmedContent = processedContent.trim().replace(/^(<br\s*\/?>\s*)+|(<br\s*\/?>\s*)+$/gi, '');
    if (!trimmedContent) return `<span class="${labelClass}" style="${styleString}"></span>`;
    return `<span class="${labelClass}" style="${styleString}">${trimmedContent}</span><br />`;
  };

  finalHtml = finalHtml.replace(/《分析》([\s\S]*?)《\/分析》/g, (match, innerContent) =>
    styleCustomBlock(innerContent, commentaryTextStyle, 'tag-label-analysis')
  );
  finalHtml = finalHtml.replace(/《思路分析》([\s\S]*?)《\/思路分析》/g, (match, innerContent) =>
    styleCustomBlock(innerContent, commentaryTextStyle, 'tag-label-思路分析')
  );
  finalHtml = finalHtml.replace(/《注释》([\s\S]*?)《\/注释》/g, (match, innerContent) =>
    styleCustomBlock(innerContent, commentaryTextStyle, 'tag-label-注释')
  );
  finalHtml = finalHtml.replace(/《点评》([\s\S]*?)《\/点评》/g, (match, innerContent) => " "); // Remove 点评
  finalHtml = finalHtml.replace(/《步骤》([\s\S]*?)《\/步骤》/g, (match, innerContent) =>
    styleCustomBlock(innerContent, commentaryTextStyle2, 'tag-label-steps')
  );

  // Consolidate multiple <br /> tags and remove leading/trailing ones
  finalHtml = finalHtml.replace(/(<br\s*\/?>\s*(\n)?){2,}/gi, '<br />\n')
    .replace(/^((<br\s*\/?>\s*(\n)?)+)|((<br\s*\/?>\s*(\n)?)+)$/gi, '');

  // Remove <br /> before or after math display blocks
  finalHtml = finalHtml.replace(/<br\s*\/?>\s*(\n)?(<span class="math-display-scrollable">)/gi, '$2')
    .replace(/(<span class="math-display-scrollable">.*?<\/span>)\s*<br\s*\/?>\s*(\n)?/gi, '$1');

  return finalHtml;
}
function sortQuestions(qA, qB) { const pageA = parseInt(safe_get(qA, 'QuestionPage'), 10); const pageB = parseInt(safe_get(qB, 'QuestionPage'), 10); const sortValA = parseInt(safe_get(qA, 'QuestionSort'), 10); const sortValB = parseInt(safe_get(qB, 'QuestionSort'), 10); const pA = isNaN(pageA) ? Infinity : pageA; const pB = isNaN(pageB) ? Infinity : pageB; const sA = isNaN(sortValA) ? Infinity : sortValA; const sB = isNaN(sortValB) ? Infinity : sortValB; if (pA !== pB) { return pA - pB; } if (sA !== sB) { return sA - sB; } const idA = parseInt(safe_get(qA, 'SourceID', "0"), 10); const idB = parseInt(safe_get(qB, 'SourceID', "0"), 10); return (isNaN(idA) ? Infinity : idA) - (isNaN(idB) ? Infinity : idB); }
async function populateSidebar(bookIdToLoad) { if(topNavBookTitleNewEl && topNavBookTitleNewEl.textContent.includes("题目详情")) {} else if(topNavBookTitleNewEl) { topNavBookTitleNewEl.textContent = '题目详情'; } if(sidebarBookTitleNewEl && sidebarBookTitleNewEl.textContent.includes("章节题目")) {} else if(sidebarBookTitleNewEl) { sidebarBookTitleNewEl.textContent = '章节题目'; } bookQuestionsList = []; sortedBookQuestionSourceIDs = []; if (!bookIdToLoad) { if(sidebarInfoMsgNewEl) sidebarInfoMsgNewEl.textContent='当前无书本上下文。'; if(sidebarToggleBtnNewEl) sidebarToggleBtnNewEl.style.display='none'; updateNavigationControlsState(); return; } if(sidebarToggleBtnNewEl) sidebarToggleBtnNewEl.style.display='block'; if(sidebarInfoMsgNewEl) { sidebarInfoMsgNewEl.style.display='block'; sidebarInfoMsgNewEl.innerHTML='<span class="loading-spinner" style="border-width:2px; width:14px; height:14px;"></span> 加载书本信息...';} if(sidebarChaptersContainerNewEl && !sidebarChaptersContainerNewEl.querySelector('.message')) displaySidebarMessage('<span class="loading-spinner" style="border-width:2px; width:14px; height:14px;"></span> 加载书本信息...', 'info'); try { const summaryResponse = await fetch(`${PHP_API_BASE_PATH}book_details.php?book_id=${bookIdToLoad}`); if (!summaryResponse.ok) throw new Error(`HTTP ${summaryResponse.status} 获取书本概要`); const bookSummaryData = await summaryResponse.json(); if (bookSummaryData.error) { displaySidebarMessage(`加载书本失败: ${bookSummaryData.error}`, 'error'); if(sidebarBookTitleNewEl) sidebarBookTitleNewEl.textContent='加载错误'; if(topNavBookTitleNewEl) topNavBookTitleNewEl.textContent='详情-书本错误'; updateNavigationControlsState(); return; } const fetchedBookTitle = bookSummaryData.BookTitle || `书本ID:${bookIdToLoad}`; if(sidebarBookTitleNewEl) sidebarBookTitleNewEl.textContent=fetchedBookTitle; if(topNavBookTitleNewEl) topNavBookTitleNewEl.textContent=fetchedBookTitle; if(leftSidebarNewEl) leftSidebarNewEl.dataset.currentBookId = bookIdToLoad; bookQuestionsList = safe_get(bookSummaryData, 'questions', []); if (bookQuestionsList.length === 0) { displaySidebarMessage('本书没有题目。', 'info'); updateNavigationControlsState(); return; } if(sidebarInfoMsgNewEl) sidebarInfoMsgNewEl.style.display='none'; if(sidebarChaptersContainerNewEl) sidebarChaptersContainerNewEl.innerHTML=''; let hasNamedChapters = bookQuestionsList.some(q => { const chapName = safe_get(q,'BookChapter',""); return typeof chapName === 'string' && chapName.trim() !== ""; }); if (hasNamedChapters) { const chapters = {}; bookQuestionsList.forEach(q => { const chapName = (safe_get(q,'BookChapter',"").trim() || "未分类章节"); const chapSortKey = parseInt(safe_get(q,'ChapterSort', "Infinity"),10); if(!chapters[chapName]) chapters[chapName] = {name: chapName, sortKey: isNaN(chapSortKey)?Infinity:chapSortKey, questions:[]}; chapters[chapName].questions.push(q); }); const sortedChapterNames = Object.keys(chapters).sort((a,b) => chapters[a].sortKey - chapters[b].sortKey); sortedChapterNames.forEach(chapterKey => { const chapterData = chapters[chapterKey]; chapterData.questions.sort(sortQuestions); chapterData.questions.forEach(q_item => { const sid = String(safe_get(q_item, 'SourceID', '')); if (sid && sid !== "null" && sid !== "undefined") { sortedBookQuestionSourceIDs.push(sid); } }); const chapGrpDiv = document.createElement('div'); chapGrpDiv.className='chapter-group new-sidebar-chapter-group'; chapGrpDiv.dataset.chapterName = chapterData.name; const chapHeadDiv = document.createElement('div'); chapHeadDiv.className='chapter-header new-sidebar-chapter-header'; chapHeadDiv.innerHTML=`<span>${chapterData.name}</span><span class="arrow">❯</span>`; const qsContDiv = document.createElement('div'); qsContDiv.className='chapter-questions-container new-sidebar-questions-container'; qsContDiv.style.display='none'; chapHeadDiv.addEventListener('click', ()=>{ const isExp = chapHeadDiv.classList.toggle('expanded'); qsContDiv.style.display = isExp ? 'block' : 'none'; if (isExp) { if(!qsContDiv.dataset.loaded){ const spin = document.createElement('div'); spin.className='loading-spinner'; spin.style.cssText='border-width:2px; width:14px; height:14px;'; qsContDiv.innerHTML=''; qsContDiv.appendChild(spin); setTimeout(()=>{ loadChapterImagesForSidebar(qsContDiv, chapterData.questions, spin); qsContDiv.dataset.loaded='true'; if(currentVisibleSourceId) highlightCurrentQuestionInSidebar(currentVisibleSourceId); },50); } else { if(currentVisibleSourceId) highlightCurrentQuestionInSidebar(currentVisibleSourceId); } } }); chapGrpDiv.appendChild(chapHeadDiv); chapGrpDiv.appendChild(qsContDiv); if(sidebarChaptersContainerNewEl) sidebarChaptersContainerNewEl.appendChild(chapGrpDiv); }); } else { bookQuestionsList.sort(sortQuestions); sortedBookQuestionSourceIDs = bookQuestionsList.map(q => String(safe_get(q, 'SourceID', ''))).filter(id => id && id !== "null" && id !== "undefined"); if(sidebarChaptersContainerNewEl) displaySidebarMessage('<span class="loading-spinner" style="border-width:2px; width:14px; height:14px;"></span> 加载所有题目预览...', 'info'); const fullDataResp = await fetch(`${PHP_API_BASE_PATH}book_preview_with_text.php?book_id=${bookIdToLoad}`); if (!fullDataResp.ok) throw new Error(`HTTP ${fullDataResp.status} for sidebar text previews`); const bookDataWithText = await fullDataResp.json(); if (bookDataWithText.error) { displaySidebarMessage(`预览加载失败: ${bookDataWithText.error}`, 'error'); return; } let questionsWithTextFromPreviewAPI = safe_get(bookDataWithText, 'questions', []); if (sidebarChaptersContainerNewEl) sidebarChaptersContainerNewEl.innerHTML = ''; const list = document.createElement('ul'); list.style.cssText = 'padding-left:10px; list-style:none;'; sortedBookQuestionSourceIDs.forEach(sid => { const qDataFromPreview = questionsWithTextFromPreviewAPI.find(q => String(safe_get(q, 'SourceID', '')) === sid); const qDataFromInitialList = bookQuestionsList.find(q => String(safe_get(q, 'SourceID', '')) === sid); const qData = qDataFromPreview || qDataFromInitialList; if (!qData) return; const li = document.createElement('li'); const a = document.createElement('a'); a.href = `${PHP_QUESTION_VIEWER_URL}?source_id=${encodeURIComponent(sid)}&book_id=${bookIdToLoad}`; a.dataset.sourceId = sid; a.className = 'no-chapter-question-link new-sidebar-question-link'; a.onclick = function(e){ e.preventDefault(); navigateToQuestion(this.dataset.sourceId, bookIdToLoad); toggleSidebar(false); }; let linkHTML = `<h3 style="font-size:0.9em; margin:0 0 3px 0;">题目 ${sid}</h3>`; const qTextPreviewDiv = document.createElement('div'); qTextPreviewDiv.className = 'question-content-preview'; qTextPreviewDiv.innerHTML = transformContextString(safe_get(qData, 'QuestionText') || '(无内容)'); linkHTML += qTextPreviewDiv.outerHTML; const qPage = safe_get(qData,'QuestionPage'); const qSortDisp = safe_get(qData,'QuestionSort'); linkHTML += `<div style="font-size:0.75em; color:var(--light-text-color); margin-top:3px;">页:${qPage||'N/A'}-序:${qSortDisp||'N/A'}</div>`; a.innerHTML = linkHTML; li.appendChild(a); list.appendChild(li); }); if(sidebarChaptersContainerNewEl) { sidebarChaptersContainerNewEl.appendChild(list); katexRenderWithRetry(sidebarChaptersContainerNewEl); } } updateNavigationControlsState(); if (currentVisibleSourceId) { highlightCurrentQuestionInSidebar(currentVisibleSourceId); autoExpandAndScrollToCurrentQuestionChapter(); } } catch (e) { logger.error('Error populating sidebar:', e); displaySidebarMessage(`侧边栏加载失败: ${e.message}`, 'error'); if(sidebarBookTitleNewEl)sidebarBookTitleNewEl.textContent='加载错误'; if(topNavBookTitleNewEl)topNavBookTitleNewEl.textContent='详情-目录错误'; updateNavigationControlsState(); } }
function assignDOMelements() { displayAreaEl = document.getElementById('question-display-area'); loadingMessageGlobalElGlobal = document.getElementById('loadingMessageGlobal'); errorMessageGlobalElGlobal = document.getElementById('errorMessageGlobal'); scrollToTopBtnElGlobal = document.getElementById('scrollToTopBtn'); prevBtnEl = document.getElementById('prev-btn'); nextBtnEl = document.getElementById('next-btn'); currentQNumEl = document.getElementById('current-q-num'); totalQNumEl = document.getElementById('total-q-num'); sidebarToggleBtnNewEl = document.getElementById('sidebarToggleBtnNew'); leftSidebarNewEl = document.getElementById('leftSidebarNew'); sidebarBookTitleNewEl = document.getElementById('sidebarBookTitleNew'); sidebarChaptersContainerNewEl = document.getElementById('sidebarChaptersContainerNew'); sidebarInfoMsgNewEl = document.getElementById('sidebarInfoMsgNew'); pageOverlayNewEl = document.getElementById('pageOverlayNew'); topNavBookTitleNewEl = document.getElementById('topNavBookTitleNew'); searchIconBtnEl = document.getElementById('searchIconBtn'); searchModalEl = document.getElementById('searchModal'); searchModalCloseBtnEl = document.getElementById('searchModalCloseBtn'); searchInputQuestionIdEl = document.getElementById('searchInputQuestionId'); searchModalSubmitBtnEl = document.getElementById('searchModalSubmitBtn'); searchModalErrorMsgEl = document.getElementById('searchModalErrorMsg'); toggleFavoriteBtnElGlobal = document.getElementById('toggleFavoriteBtn'); returnToBookshelfBtnNavEl = document.getElementById('returnToBookshelfBtnNav'); }
function showGlobalLoading(message = "加载信息中...") { if(loadingMessageGlobalElGlobal) { loadingMessageGlobalElGlobal.innerHTML = `<div class="loading-spinner" style="border-width:4px; width:24px; height:24px;"></div> ${message}`; loadingMessageGlobalElGlobal.style.display = 'block'; } if(errorMessageGlobalElGlobal) errorMessageGlobalElGlobal.style.display = 'none'; if(displayAreaEl) displayAreaEl.innerHTML = ''; }
function showGlobalError(message) { if(errorMessageGlobalElGlobal) { errorMessageGlobalElGlobal.textContent = message; errorMessageGlobalElGlobal.style.display = 'block'; } if(loadingMessageGlobalElGlobal) loadingMessageGlobalElGlobal.style.display = 'none'; }
function hideGlobalMessages() { if(loadingMessageGlobalElGlobal) loadingMessageGlobalElGlobal.style.display = 'none'; if(errorMessageGlobalElGlobal) errorMessageGlobalElGlobal.style.display = 'none'; }
function displayMessageInContentArea(message, type = 'info') { if(!displayAreaEl) return; displayAreaEl.innerHTML = ''; const msgDiv = document.createElement('div'); msgDiv.className = `message ${type}-message`; msgDiv.textContent = message; displayAreaEl.appendChild(msgDiv); hideGlobalMessages(); }
function updateNavigationControlsState() { if (currentBookId && sortedBookQuestionSourceIDs.length > 0 && currentVisibleSourceId) { currentQuestionIndexInBook = sortedBookQuestionSourceIDs.indexOf(String(currentVisibleSourceId)); if(totalQNumEl) totalQNumEl.textContent = sortedBookQuestionSourceIDs.length; if(currentQNumEl) currentQNumEl.textContent = currentQuestionIndexInBook !== -1 ? currentQuestionIndexInBook + 1 : '?'; if(prevBtnEl) prevBtnEl.disabled = currentQuestionIndexInBook <= 0; if(nextBtnEl) nextBtnEl.disabled = currentQuestionIndexInBook < 0 || currentQuestionIndexInBook >= sortedBookQuestionSourceIDs.length - 1; } else { if(totalQNumEl) totalQNumEl.textContent = currentVisibleSourceId ? '1' : '0'; if(currentQNumEl) currentQNumEl.textContent = currentVisibleSourceId ? '1' : '0'; if(prevBtnEl) prevBtnEl.disabled = true; if(nextBtnEl) nextBtnEl.disabled = true; } }
function displaySidebarMessage(message, type = 'info') { if(sidebarChaptersContainerNewEl) sidebarChaptersContainerNewEl.innerHTML = `<p class="message ${type}-message" style="padding:10px;text-align:center;">${message}</p>`; }
function highlightCurrentQuestionInSidebar(targetSourceIdStr) { const targetSourceId = String(targetSourceIdStr); if (!leftSidebarNewEl) return; leftSidebarNewEl.querySelectorAll('.new-sidebar .question-image-item a, .new-sidebar a.no-chapter-question-link').forEach(a => a.classList.remove('current-question-in-sidebar')); const currentLink = leftSidebarNewEl.querySelector(`.new-sidebar a[data-source-id="${CSS.escape(targetSourceId)}"]`); if (currentLink) { currentLink.classList.add('current-question-in-sidebar'); if (leftSidebarNewEl.classList.contains('open')) { currentLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } } }
function loadChapterImagesForSidebar(container, questionsInChapter, chapterSpinner) { if (chapterSpinner) chapterSpinner.style.display = 'none'; container.innerHTML = ''; if (questionsInChapter.length === 0) { container.innerHTML = '<p style="text-align:center; color:#777; padding:10px;">本章节下无题目。</p>'; return; } questionsInChapter.forEach(q_item => { const sourceId = safe_get(q_item, 'SourceID'); if (!sourceId && sourceId !== 0) return; const item_div = document.createElement('div'); item_div.className = 'question-image-item new-sidebar-q-item'; const linkEl = document.createElement('a'); linkEl.href = `${PHP_QUESTION_VIEWER_URL}?source_id=${encodeURIComponent(sourceId)}&book_id=${currentBookId}`; linkEl.dataset.sourceId = String(sourceId); linkEl.className = 'new-sidebar-question-link'; linkEl.addEventListener('click', function(e) { e.preventDefault(); navigateToQuestion(this.dataset.sourceId, currentBookId); toggleSidebar(false); }); const qImg = safe_get(q_item, 'QuestionImg'); const qPage = safe_get(q_item, 'QuestionPage'); const qSortDisp = safe_get(q_item, 'QuestionSort'); if (!qImg || qImg.trim() === "") { linkEl.innerHTML = `<div class="no-image-link-text">题目 ${sourceId}<br><span class="question-image-metadata">页/排序: ${qPage||'N/A'}-${qSortDisp||'N/A'}</span></div>`; } else { const imgEl = document.createElement('img'); imgEl.src = qImg; imgEl.alt=`题目 ${sourceId}`; imgEl.loading="lazy"; imgEl.onerror=function(){this.alt='图片加载失败';this.style.display='none'; const errP=document.createElement('p');errP.textContent=`图 ${sourceId} 加载失败`; this.parentElement.appendChild(errP);}; linkEl.appendChild(imgEl); const metaEl = document.createElement('div'); metaEl.className='question-image-metadata'; let pageSortTxt = ""; if(qPage && qSortDisp) pageSortTxt = `(${qPage}-${qSortDisp})`; else if(qPage) pageSortTxt = `(页:${qPage})`; else if(qSortDisp) pageSortTxt = `(排序:${qSortDisp})`; metaEl.textContent = `${pageSortTxt} ID: ${sourceId}`; linkEl.appendChild(metaEl); } item_div.appendChild(linkEl); container.appendChild(item_div); }); }
function updateUrlForCurrentQuestionDisplay() { if (!currentVisibleSourceId) return; const newUrl = new URL(PHP_QUESTION_VIEWER_URL, window.location.href); newUrl.search = ''; newUrl.searchParams.set('source_id', currentVisibleSourceId); if (currentBookId) { newUrl.searchParams.set('book_id', currentBookId); } history.replaceState({ sourceId: currentVisibleSourceId, bookId: currentBookId }, `题目 ${currentVisibleSourceId}`, newUrl.toString()); let pageTitle = `题目 ${currentVisibleSourceId}`; if (currentBookId && topNavBookTitleNewEl && topNavBookTitleNewEl.textContent && topNavBookTitleNewEl.textContent !== '题目详情' && !topNavBookTitleNewEl.textContent.includes("错误")) { pageTitle += ` - ${topNavBookTitleNewEl.textContent}`; } pageTitle += " - 详解"; document.title = pageTitle; }
async function fetchAndDisplayCurrentQuestion() { if(!displayAreaEl) { return; } showGlobalLoading("加载题目数据..."); if (PHP_IS_USER_LOGGED_IN && currentVisibleSourceId) { if (toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'inline-flex'; const isFav = await checkFavoriteStatus(currentVisibleSourceId); updateFavoriteButtonUI(isFav); } else { if (toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'none'; } if (!currentVisibleSourceId) { displayCurrentQuestion(); return; } if (allQuestionsData[currentVisibleSourceId]) { displayCurrentQuestion(); autoExpandAndScrollToCurrentQuestionChapter(); return; } let apiUrl = `${PHP_API_BASE_PATH}single_question_data.php?global_question_id=${encodeURIComponent(currentVisibleSourceId)}`; if (currentBookId) { apiUrl += `&book_id=${encodeURIComponent(currentBookId)}`; } try { const response = await fetch(apiUrl); if (!response.ok) { throw new Error(`HTTP error ${response.status} for Q ${currentVisibleSourceId}.`); } const singleQDataWrapper = await response.json(); if (!singleQDataWrapper || !singleQDataWrapper[currentVisibleSourceId]) { throw new Error(`题目数据 (ID: ${currentVisibleSourceId}) 返回格式无效或为空。`);} allQuestionsData[currentVisibleSourceId] = singleQDataWrapper[currentVisibleSourceId]; displayCurrentQuestion(); updateUrlForCurrentQuestionDisplay(); autoExpandAndScrollToCurrentQuestionChapter(); } catch (error) { showGlobalError(`加载题目 ${currentVisibleSourceId} 失败: ${error.message}`); updateNavigationControlsState(); } }
function displayCurrentQuestion() { const sourceIdToDisplayStr = String(currentVisibleSourceId); if (!displayAreaEl) { return; } if (!sourceIdToDisplayStr || sourceIdToDisplayStr === "null" || sourceIdToDisplayStr === "undefined") { displayMessageInContentArea('请从侧边栏选择题目或通过URL指定有效的题目ID。'); if(currentQNumEl) currentQNumEl.textContent = '0'; if(totalQNumEl) totalQNumEl.textContent = currentBookId ? (sortedBookQuestionSourceIDs.length || '0') : '0'; if(prevBtnEl) prevBtnEl.disabled = true; if(nextBtnEl) nextBtnEl.disabled = true; if (topNavBookTitleNewEl && currentBookId && sidebarBookTitleNewEl && sidebarBookTitleNewEl.textContent !== '章节题目' && !sidebarBookTitleNewEl.textContent.includes("加载错误")) { topNavBookTitleNewEl.textContent = sidebarBookTitleNewEl.textContent; } else if (topNavBookTitleNewEl && !currentBookId ) { topNavBookTitleNewEl.textContent = "题目详情"; } if (toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'none'; return; } const questionEntry = allQuestionsData[sourceIdToDisplayStr]; if (!questionEntry) { fetchAndDisplayCurrentQuestion(); return; } if (Object.keys(questionEntry).length === 0 || !safe_get(questionEntry, 'first_request.0')) { displayMessageInContentArea(`题目 ${sourceIdToDisplayStr} 的核心数据不完整。`, 'error'); updateNavigationControlsState(); if (PHP_IS_USER_LOGGED_IN && toggleFavoriteBtnElGlobal) { toggleFavoriteBtnElGlobal.style.display = 'inline-flex'; updateFavoriteButtonUI(false); } return; } hideGlobalMessages(); displayAreaEl.innerHTML = ''; const fr = safe_get(questionEntry, 'first_request.0', {}); if (safe_get(fr, 'QuestionTxt') || safe_get(fr, 'GlobalQuestionID')) { const frContainer = document.createElement('div'); frContainer.className = 'content-container'; const idEl = document.createElement('div'); idEl.className = 'question-identifier'; const globalIdFromData = safe_get(fr, 'GlobalQuestionID', sourceIdToDisplayStr); let displayText = ""; if (safe_get(fr, 'CurrentBrowsingBookID') && safe_get(fr, 'CurrentBookTitle')) { let pageSortPart = ""; const bookPage = safe_get(fr, 'CurrentBookQuestionPage'); const bookSort = safe_get(fr, 'CurrentBookQuestionSort'); if (bookPage && bookSort) pageSortPart = `(${bookPage}-${bookSort})`; else if (bookPage) pageSortPart = `(页码: ${bookPage})`; else if (bookSort) pageSortPart = `(序号: ${bookSort})`; displayText = pageSortPart ? `${pageSortPart} ID: ${globalIdFromData} 《${safe_get(fr, 'CurrentBookTitle')}》` : `ID: ${globalIdFromData} 《${safe_get(fr, 'CurrentBookTitle')}》`; } else { let pageContextPart = safe_get(fr, 'LegacyOriginalQuestionSort') ? `(序号: ${safe_get(fr, 'LegacyOriginalQuestionSort')})` : ""; displayText = `ID: ${globalIdFromData}`; if (pageContextPart) displayText = `${pageContextPart} ${displayText}`; if (safe_get(fr, 'LegacyOriginalBookTitle')) displayText += ` 《${safe_get(fr, 'LegacyOriginalBookTitle')}》`; else if (safe_get(fr, 'LegacyOriginalBookID')) displayText += ` (原书ID: ${safe_get(fr, 'LegacyOriginalBookID')})`; } idEl.textContent = displayText.trim(); frContainer.appendChild(idEl); const questionTextFromData = safe_get(fr, 'QuestionTxt'); if (questionTextFromData) { const qTextEl = document.createElement('div'); qTextEl.innerHTML = transformContextString(questionTextFromData); frContainer.appendChild(qTextEl); } displayAreaEl.appendChild(frContainer); } let viewAnswerButton = null; let answerSectionWrapper = null; const secondRequestItems = safe_get(questionEntry, 'second_request', []); if (Array.isArray(secondRequestItems) && secondRequestItems.length > 0) { const KAO_DIAN_BUS_TYPE = "考点"; const YI_NAN_DIAN_BUS_TYPE = "疑难点"; const groupedKnowledgePoints = {}; const otherDetails = []; secondRequestItems.forEach(item => { const busType = safe_get(item, 'BusType'); if (busType === KAO_DIAN_BUS_TYPE || busType === YI_NAN_DIAN_BUS_TYPE) { if (!groupedKnowledgePoints[busType]) groupedKnowledgePoints[busType] = []; groupedKnowledgePoints[busType].push(item); } else { otherDetails.push(item); } }); const busTypeOrder = ["题目详解", "一题多解", "答案", "解析", "思路分析", "步骤", "注释", "分析", "点评"]; otherDetails.sort((a, b) => { const orderA = busTypeOrder.indexOf(safe_get(a, 'BusType')); const orderB = busTypeOrder.indexOf(safe_get(b, 'BusType')); if (orderA === -1 && orderB === -1) return String(safe_get(a,'BusType',"")).localeCompare(String(safe_get(b,'BusType',""))); if (orderA === -1) return 1; if (orderB === -1) return -1; return orderA - orderB; }); if (otherDetails.length > 0) { viewAnswerButton = document.createElement('button'); viewAnswerButton.textContent = '查看答案/解析'; viewAnswerButton.className = 'view-answer-btn'; answerSectionWrapper = document.createElement('div'); answerSectionWrapper.id = 'answer-section-wrapper'; answerSectionWrapper.style.display = 'none'; viewAnswerButton.addEventListener('click', () => { if (answerSectionWrapper) { answerSectionWrapper.style.display = 'block'; katexRenderWithRetry(answerSectionWrapper); } if (viewAnswerButton) { viewAnswerButton.style.display = 'none'; } }); const detailsHeader = document.createElement('div'); detailsHeader.className = 'section-header'; detailsHeader.textContent = '答案与解析'; answerSectionWrapper.appendChild(detailsHeader); otherDetails.forEach(item => { const detailContainer = document.createElement('div'); detailContainer.className = 'content-container'; let headerHtml = ''; const itemBusType = safe_get(item, 'BusType'); if (itemBusType) { if (['答案', '解析', '证明'].includes(itemBusType)) { headerHtml += `<span class="tag-label-${itemBusType.toLowerCase()}">${itemBusType}</span> `; } else if (['步骤'].includes(itemBusType)){ headerHtml += `<span class="tag-label-steps">${itemBusType}</span> `; } else if (['分析', '思路分析', '注释'].includes(itemBusType)){ headerHtml += `<span class="tag-label-analysis">${itemBusType}</span> `; } else { headerHtml += `<span class="bus-type-label">${itemBusType}</span>`; } } const itemTitle = safe_get(item, 'Title'); if (itemTitle) { headerHtml += `<span class="detail-title">${transformContextString(itemTitle)}</span>`; } if (headerHtml) { detailContainer.innerHTML = headerHtml + '<hr style="border:0; border-top:1px solid var(--light-border-color); margin:8px 0;">'; } const contentWrapper = document.createElement('div'); contentWrapper.className = 'details-section-content'; const itemContext = safe_get(item, 'Context'); if (itemContext) { contentWrapper.innerHTML = transformContextString(itemContext); } detailContainer.appendChild(contentWrapper); answerSectionWrapper.appendChild(detailContainer); }); displayAreaEl.appendChild(viewAnswerButton); displayAreaEl.appendChild(answerSectionWrapper); } [KAO_DIAN_BUS_TYPE, YI_NAN_DIAN_BUS_TYPE].forEach(groupBusType => { if (groupedKnowledgePoints[groupBusType] && groupedKnowledgePoints[groupBusType].length > 0) { const groupContainer = document.createElement('div'); groupContainer.className = 'knowledge-point-group-container'; const groupHeader = document.createElement('div'); groupHeader.className = 'knowledge-point-group-header'; let headerIcon = groupBusType === KAO_DIAN_BUS_TYPE ? '🟠 ' : '🔴 '; groupHeader.textContent = headerIcon + groupBusType; groupContainer.appendChild(groupHeader); groupedKnowledgePoints[groupBusType].sort((a, b) => (safe_get(a,'ID',0)) - (safe_get(b,'ID',0))); groupedKnowledgePoints[groupBusType].forEach(item => { const kpItemDiv = document.createElement('div'); kpItemDiv.className = 'knowledge-point-item'; let itemHtmlContent = ''; const kpData = safe_get(item, '_question_code', {}); const kpCode = safe_get(kpData, 'Code'); const itemDetailTitle = safe_get(item, 'Title'); const kpGenericTitle = safe_get(kpData, 'Title'); let titlePart = ''; if (itemDetailTitle) { titlePart = `<div class="kp-item-title">${transformContextString(itemDetailTitle)}</div>`; } else if (kpGenericTitle) { titlePart = `<div class="kp-item-title">${transformContextString(kpGenericTitle)}</div>`; } itemHtmlContent += titlePart; const kpContent = safe_get(kpData, 'Content'); if (kpContent) { itemHtmlContent += `<div class="kp-content">${transformContextString(kpContent)}</div>`; } const kpNotes = safe_get(kpData, 'Notes'); if (kpNotes) { itemHtmlContent += `<div class="kp-notes">注: ${transformContextString(kpNotes)}</div>`; } const itemContextDirect = safe_get(item, 'Context'); if (itemContextDirect && !kpContent && !kpNotes) { itemHtmlContent += `<div class="kp-content">${transformContextString(itemContextDirect)}</div>`; } kpItemDiv.innerHTML = itemHtmlContent; groupContainer.appendChild(kpItemDiv); }); displayAreaEl.appendChild(groupContainer); } }); } const thirdRequestItems = safe_get(questionEntry, 'third_request', []); if (Array.isArray(thirdRequestItems) && thirdRequestItems.length > 0) { const relatedWrapper = document.createElement('div'); const relatedHeader = document.createElement('div'); relatedHeader.className = 'section-header'; const relatedHeaderTitle = document.createElement('span'); relatedHeaderTitle.textContent = '相关题目'; relatedHeader.appendChild(relatedHeaderTitle); const relatedItemsContainer = document.createElement('div'); let relatedExpanded = thirdRequestItems.length === 1; if (thirdRequestItems.length > 1) { const toggleBtn = document.createElement('button'); toggleBtn.className = 'related-toggle-arrow-btn'; toggleBtn.innerHTML = relatedExpanded ? '▼' : '❯'; if (relatedExpanded) toggleBtn.classList.add('expanded'); toggleBtn.setAttribute('aria-expanded', relatedExpanded); toggleBtn.addEventListener('click', () => { relatedExpanded = !relatedExpanded; toggleBtn.innerHTML = relatedExpanded ? '▼' : '❯'; toggleBtn.classList.toggle('expanded', relatedExpanded); toggleBtn.setAttribute('aria-expanded', relatedExpanded); Array.from(relatedItemsContainer.children).forEach((child, index) => { if (index > 0) child.classList.toggle('related-question-hidden', !relatedExpanded); }); }); relatedHeader.appendChild(toggleBtn); } relatedWrapper.appendChild(relatedHeader); thirdRequestItems.forEach((relItem, index) => { const relContainer = document.createElement('div'); relContainer.className = 'content-container related-question-item'; if (thirdRequestItems.length > 1 && index > 0 && !relatedExpanded) { relContainer.classList.add('related-question-hidden'); } const relSourceId = safe_get(relItem, 'ID', 'N/A'); const relLegacyQuestionId = safe_get(relItem, 'QuestionID'); let relHeaderBaseText = `<strong>相关题 (源ID: ${relSourceId}`; if (relLegacyQuestionId && String(relLegacyQuestionId) !== String(relSourceId)) { relHeaderBaseText += `, 旧关联ID: ${relLegacyQuestionId}`; } relHeaderBaseText += `)</strong>`; let fullRelHeaderHtml = relHeaderBaseText; if (relSourceId !== 'N/A') { fullRelHeaderHtml += ` <a href="#" class="related-question-link" data-related-qid="${relSourceId}" data-related-book-id="${currentBookId || ''}" title="跳转到题目 ${relSourceId}">跳转此题</a>`; } relContainer.innerHTML = fullRelHeaderHtml + '<hr style="border:0; border-top:1px solid var(--light-border-color); margin:8px 0;">'; const relQuestionTxt = safe_get(relItem, 'QuestionTxt'); if (relQuestionTxt) { const relTextEl = document.createElement('div'); relTextEl.innerHTML = transformContextString(relQuestionTxt); relContainer.appendChild(relTextEl); } const relLinkNames = safe_get(relItem, 'LinkNames'); if (relLinkNames) { const linkNamesEl = document.createElement('p'); linkNamesEl.style.cssText = "color:var(--light-text-color);font-size:0.9em;font-style:italic;margin-top:8px;"; linkNamesEl.textContent = `知识点链接: ${relLinkNames}`; relContainer.appendChild(linkNamesEl); } relatedItemsContainer.appendChild(relContainer); }); relatedWrapper.appendChild(relatedItemsContainer); displayAreaEl.appendChild(relatedWrapper); } updateNavigationControlsState(); if (typeof highlightCurrentQuestionInSidebar === 'function') { highlightCurrentQuestionInSidebar(sourceIdToDisplayStr); } katexRenderWithRetry(displayAreaEl); if (PHP_IS_USER_LOGGED_IN && toggleFavoriteBtnElGlobal) { toggleFavoriteBtnElGlobal.style.display = 'inline-flex'; } }
async function navigateToQuestion(sourceId, bookIdForNav = null) { currentVisibleSourceId = String(sourceId); const previousBookId = currentBookId; currentBookId = bookIdForNav ? String(bookIdForNav) : null; const newUrl = new URL(PHP_QUESTION_VIEWER_URL, window.location.href); newUrl.search = ''; newUrl.searchParams.set('source_id', currentVisibleSourceId); if (currentBookId) { newUrl.searchParams.set('book_id', currentBookId); } const newUrlString = newUrl.toString(); if (PHP_IS_USER_LOGGED_IN) { const isFav = await checkFavoriteStatus(currentVisibleSourceId); updateFavoriteButtonUI(isFav); } if (window.location.href !== newUrlString) { history.pushState({ sourceId: currentVisibleSourceId, bookId: currentBookId }, `题目 ${currentVisibleSourceId}`, newUrlString); if (String(previousBookId) !== String(currentBookId)) { if (currentBookId) { populateSidebar(currentBookId).then(() => fetchAndDisplayCurrentQuestion()); } else { if(sidebarChaptersContainerNewEl) sidebarChaptersContainerNewEl.innerHTML=''; fetchAndDisplayCurrentQuestion(); } } else { fetchAndDisplayCurrentQuestion(); } } else { fetchAndDisplayCurrentQuestion(); } let pageTitle = `题目 ${currentVisibleSourceId}`; if (currentBookId && topNavBookTitleNewEl && topNavBookTitleNewEl.textContent && topNavBookTitleNewEl.textContent !== '题目详情' && !topNavBookTitleNewEl.textContent.includes("错误")) { pageTitle += ` - ${topNavBookTitleNewEl.textContent}`; } pageTitle += " - 详解"; document.title = pageTitle; }
function autoExpandAndScrollToCurrentQuestionChapter() { if (!currentVisibleSourceId || !leftSidebarNewEl || !leftSidebarNewEl.classList.contains('open')) { if (currentVisibleSourceId && leftSidebarNewEl && leftSidebarNewEl.classList.contains('open')) { highlightCurrentQuestionInSidebar(currentVisibleSourceId); } return; } const currentQuestionData = bookQuestionsList.find(q => String(safe_get(q, 'SourceID')) === String(currentVisibleSourceId)); const hasNamedChaptersInSidebar = leftSidebarNewEl.querySelector('.new-sidebar-chapter-group'); if (!hasNamedChaptersInSidebar) { highlightCurrentQuestionInSidebar(currentVisibleSourceId); return; } if (!currentQuestionData) { highlightCurrentQuestionInSidebar(currentVisibleSourceId); return; } const targetChapterName = (safe_get(currentQuestionData, 'BookChapter', "").trim() || "未分类章节"); const chapterGroupEl = leftSidebarNewEl.querySelector(`.new-sidebar-chapter-group[data-chapter-name="${CSS.escape(targetChapterName)}"]`); if (!chapterGroupEl) { highlightCurrentQuestionInSidebar(currentVisibleSourceId); return; } const chapterHeader = chapterGroupEl.querySelector('.chapter-header.new-sidebar-chapter-header'); const questionsContainer = chapterGroupEl.querySelector('.chapter-questions-container.new-sidebar-questions-container'); if (chapterHeader && questionsContainer) { if (!chapterHeader.classList.contains('expanded')) { chapterHeader.click(); } else { if (questionsContainer.dataset.loaded === 'true') { highlightCurrentQuestionInSidebar(currentVisibleSourceId); } } } else { highlightCurrentQuestionInSidebar(currentVisibleSourceId); } }
async function mainInit() { assignDOMelements(); const urlParams = new URLSearchParams(window.location.search); currentBookId = urlParams.get('book_id') || PHP_INITIAL_BOOK_ID; currentVisibleSourceId = urlParams.get('source_id') || PHP_INITIAL_SOURCE_ID; let initialDocTitle = "题目详情"; const phpBookTitleText = <?php echo json_encode($book_title_php); ?>; if (currentVisibleSourceId) { initialDocTitle = `题目 ${currentVisibleSourceId}`; if (currentBookId && phpBookTitleText && !["题目详情", "书籍未找到", "查询书籍标题出错", "数据库连接失败"].includes(phpBookTitleText) ) { initialDocTitle += ` - ${phpBookTitleText}`; } initialDocTitle += " - 详解"; } else if (currentBookId && phpBookTitleText && !["题目详情", "书籍未找到", "查询书籍标题出错", "数据库连接失败"].includes(phpBookTitleText)) { initialDocTitle = `${phpBookTitleText} - 详解`; } document.title = initialDocTitle; if(topNavBookTitleNewEl && phpBookTitleText) topNavBookTitleNewEl.textContent = phpBookTitleText; if (currentBookId) { await populateSidebar(currentBookId); } else { if(sidebarToggleBtnNewEl) sidebarToggleBtnNewEl.style.display = 'none'; if(topNavBookTitleNewEl) topNavBookTitleNewEl.textContent = '题目详情 (无书本)'; bookQuestionsList = []; sortedBookQuestionSourceIDs = []; if(sidebarInfoMsgNewEl) sidebarInfoMsgNewEl.textContent = '无书本信息。'; } if (currentVisibleSourceId) { await fetchAndDisplayCurrentQuestion(); } else { if (currentBookId && sortedBookQuestionSourceIDs.length > 0) { navigateToQuestion(sortedBookQuestionSourceIDs[0], currentBookId); } else if (!currentBookId) { displayMessageInContentArea('请通过书架选择一本书，或通过URL提供题目ID。'); updateNavigationControlsState(); if(toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'none'; } else { displayMessageInContentArea('本书暂无题目或列表加载失败。'); updateNavigationControlsState(); if(toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'none'; } } }

// --- Favorite Functions ---
async function checkFavoriteStatus(questionId) {
    if (!PHP_IS_USER_LOGGED_IN) {
        if(toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'none';
        return false;
    }
    if (!questionId) {
        if(toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'none';
        return false;
    }
    try {
        const response = await fetch(`${PHP_API_BASE_PATH}check_favorite_status.php?global_question_id=${encodeURIComponent(questionId)}`);
        if (!response.ok) {
            logger.error(`HTTP error ${response.status} checking favorite status. Response: ${await response.text()}`);
            if(toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'inline-flex'; // Keep visible for retry attempt by user
            return false; // Assume not favorited on error
        }
        // IMPORTANT: Check content type before parsing as JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            if (data.error && data.error === 'User not logged in.') {
                if(toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'none';
                return false;
            }
            if(toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'inline-flex';
            return data.isFavorited === true;
        } else {
            logger.error('checkFavoriteStatus: Response was not JSON. Received:', await response.text());
            if(toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'inline-flex';
            return false; // Assume not favorited if response is not JSON
        }
    } catch (error) { // Catches network errors and JSON parsing errors if response.json() fails
        logger.error('Error checking favorite status:', error);
        if(toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'inline-flex';
        return false;
    }
}

function updateFavoriteButtonUI(isFavorited) { if (!toggleFavoriteBtnElGlobal) return; const svgIcon = toggleFavoriteBtnElGlobal.querySelector('svg'); if (isFavorited) { toggleFavoriteBtnElGlobal.classList.add('is-favorited'); if (svgIcon) svgIcon.style.fill = 'currentColor'; } else { toggleFavoriteBtnElGlobal.classList.remove('is-favorited'); if (svgIcon) svgIcon.style.fill = 'none'; } }

async function toggleFavorite() {
    if (!currentVisibleSourceId || !toggleFavoriteBtnElGlobal || !PHP_IS_USER_LOGGED_IN) return;
    const isCurrentlyFavorited = toggleFavoriteBtnElGlobal.classList.contains('is-favorited');
    const actionUrl = isCurrentlyFavorited ? `${PHP_API_BASE_PATH}remove_favorite.php` : `${PHP_API_BASE_PATH}add_favorite.php`;
    const qDataForFavorite = allQuestionsData[currentVisibleSourceId];
    const globalIdForFavorite = safe_get(qDataForFavorite, 'first_request.0.GlobalQuestionID', currentVisibleSourceId);
    if (!globalIdForFavorite) { logger.error("Cannot toggle favorite: Global Question ID not available."); return; }
    const formData = new FormData();
    formData.append('global_question_id', globalIdForFavorite);
    if (currentBookId) { formData.append('book_id', currentBookId); }
    try {
        toggleFavoriteBtnElGlobal.disabled = true;
        const response = await fetch(actionUrl, { method: 'POST', body: formData });
        if (!response.ok) {
            logger.error(`HTTP error ${response.status} toggling favorite. Response: ${await response.text()}`);
            updateFavoriteButtonUI(isCurrentlyFavorited); // Revert on error
            return;
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            if (data.success) {
                updateFavoriteButtonUI(!isCurrentlyFavorited);
            } else {
                logger.error('Failed to toggle favorite:', data.error || 'Unknown API error');
                if (data.error === 'User not logged in.') {
                    if(toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'none';
                } else {
                    updateFavoriteButtonUI(isCurrentlyFavorited); // Revert on specific API error
                }
            }
        } else {
            logger.error('toggleFavorite: Response was not JSON. Received:', await response.text());
            updateFavoriteButtonUI(isCurrentlyFavorited); // Revert if response is not JSON
        }
    } catch (error) { logger.error('Error toggling favorite:', error); updateFavoriteButtonUI(isCurrentlyFavorited); }
    finally { if (toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.disabled = false; }
}

document.addEventListener('DOMContentLoaded', () => {
    mainInit();
    if(scrollToTopBtnElGlobal) { scrollToTopBtnElGlobal.style.display = 'none'; window.addEventListener('scroll', () => { if(scrollToTopBtnElGlobal) scrollToTopBtnElGlobal.style.display = (window.pageYOffset > 200) ? 'flex' : 'none'; }); scrollToTopBtnElGlobal.addEventListener('click', e => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); }); }
    if(sidebarToggleBtnNewEl) sidebarToggleBtnNewEl.addEventListener('click', () => toggleSidebar());
    if(pageOverlayNewEl) pageOverlayNewEl.addEventListener('click', () => toggleSidebar(false));
    if(returnToBookshelfBtnNavEl) returnToBookshelfBtnNavEl.addEventListener('click', () => { window.location.href = PHP_BOOKSHELF_URL; });
    if(prevBtnEl) prevBtnEl.addEventListener('click', () => { if (currentBookId && sortedBookQuestionSourceIDs.length > 0 && currentQuestionIndexInBook > 0) { navigateToQuestion(sortedBookQuestionSourceIDs[currentQuestionIndexInBook - 1], currentBookId); } });
    if(nextBtnEl) nextBtnEl.addEventListener('click', () => { if (currentBookId && sortedBookQuestionSourceIDs.length > 0 && currentQuestionIndexInBook >= 0 && currentQuestionIndexInBook < sortedBookQuestionSourceIDs.length - 1) { navigateToQuestion(sortedBookQuestionSourceIDs[currentQuestionIndexInBook + 1], currentBookId); } });
    window.addEventListener('popstate', async (event) => { const state = event.state || {}; const newSourceId = state.sourceId || new URLSearchParams(window.location.search).get('source_id'); const newBookId = state.bookId || new URLSearchParams(window.location.search).get('book_id'); let bookChanged = String(newBookId) !== String(currentBookId); currentBookId = newBookId ? String(newBookId) : null; currentVisibleSourceId = newSourceId ? String(newSourceId) : null; if (PHP_IS_USER_LOGGED_IN && currentVisibleSourceId) { const isFav = await checkFavoriteStatus(currentVisibleSourceId); updateFavoriteButtonUI(isFav); } else if (toggleFavoriteBtnElGlobal) { toggleFavoriteBtnElGlobal.style.display = 'none'; } if (bookChanged && currentBookId) { populateSidebar(currentBookId).then(() => { if (currentVisibleSourceId) fetchAndDisplayCurrentQuestion(); else if (sortedBookQuestionSourceIDs.length > 0) navigateToQuestion(sortedBookQuestionSourceIDs[0], currentBookId); else { displayMessageInContentArea('请选择题目。'); updateNavigationControlsState(); } }); } else if (currentVisibleSourceId) { fetchAndDisplayCurrentQuestion(); } else if (!currentVisibleSourceId && !currentBookId) { displayMessageInContentArea('请通过侧边栏或搜索选择题目。'); if(sidebarChaptersContainerNewEl) sidebarChaptersContainerNewEl.innerHTML = ''; if(sidebarBookTitleNewEl) sidebarBookTitleNewEl.textContent = '章节题目'; if(topNavBookTitleNewEl) topNavBookTitleNewEl.textContent = '题目详情'; bookQuestionsList = []; sortedBookQuestionSourceIDs = []; updateNavigationControlsState(); if(toggleFavoriteBtnElGlobal) toggleFavoriteBtnElGlobal.style.display = 'none'; } else if (currentBookId && !currentVisibleSourceId && bookChanged) { populateSidebar(currentBookId).then(() => { if (sortedBookQuestionSourceIDs.length > 0) navigateToQuestion(sortedBookQuestionSourceIDs[0], currentBookId); else { displayMessageInContentArea('本书无题目。'); updateNavigationControlsState(); } }); } });
    if (searchIconBtnEl) searchIconBtnEl.addEventListener('click', openSearchModal);
    if (searchModalCloseBtnEl) searchModalCloseBtnEl.addEventListener('click', closeSearchModal);
    if (searchModalSubmitBtnEl) searchModalSubmitBtnEl.addEventListener('click', handleSearchSubmit);
    if (searchInputQuestionIdEl) searchInputQuestionIdEl.addEventListener('keypress', function(event) { if (event.key === 'Enter') { event.preventDefault(); handleSearchSubmit(); } });
    if (searchModalEl) searchModalEl.addEventListener('click', function(event) { if (event.target === searchModalEl) { closeSearchModal(); } });
    document.addEventListener('keydown', function(event) { if (event.key === 'Escape' && searchModalEl && searchModalEl.classList.contains('active')) { closeSearchModal(); } });
    if(displayAreaEl) { displayAreaEl.addEventListener('click', function(event) { const targetLink = event.target.closest('a.related-question-link'); if (targetLink && targetLink.dataset.relatedQid) { event.preventDefault(); const relatedQSourceId = targetLink.dataset.relatedQid; const relatedBookIdForNav = targetLink.dataset.relatedBookId && targetLink.dataset.relatedBookId !== "null" && targetLink.dataset.relatedBookId !== "" ? targetLink.dataset.relatedBookId : null; navigateToQuestion(relatedQSourceId, relatedBookIdForNav || currentBookId); } }); }
    if (PHP_IS_USER_LOGGED_IN && toggleFavoriteBtnElGlobal) { toggleFavoriteBtnElGlobal.addEventListener('click', toggleFavorite); }
});

function openSearchModal() { if (searchModalEl) { searchModalEl.classList.add('active'); if(searchInputQuestionIdEl) searchInputQuestionIdEl.focus(); if(searchModalErrorMsgEl) searchModalErrorMsgEl.textContent = ''; } }
function closeSearchModal() { if (searchModalEl) { searchModalEl.classList.remove('active'); if(searchInputQuestionIdEl) searchInputQuestionIdEl.value = ''; if(searchModalErrorMsgEl) searchModalErrorMsgEl.textContent = ''; } }
function handleSearchSubmit() { const questionId = searchInputQuestionIdEl ? searchInputQuestionIdEl.value.trim() : ''; if(searchModalErrorMsgEl) searchModalErrorMsgEl.textContent = ''; if (!questionId) { if(searchModalErrorMsgEl) searchModalErrorMsgEl.textContent = '请输入题目ID。'; if(searchInputQuestionIdEl) searchInputQuestionIdEl.focus(); return; } if (!/^\d+$/.test(questionId)) { if(searchModalErrorMsgEl) searchModalErrorMsgEl.textContent = '题目ID必须是纯数字。'; if(searchInputQuestionIdEl) searchInputQuestionIdEl.focus(); return; } navigateToQuestion(questionId, currentBookId); closeSearchModal(); }
function toggleSidebar(forceOpen) { if(!leftSidebarNewEl || !pageOverlayNewEl) return; const isOpenCurrently = leftSidebarNewEl.classList.contains('open'); let openAction = (typeof forceOpen === 'boolean') ? forceOpen : !isOpenCurrently; leftSidebarNewEl.classList.toggle('open', openAction); pageOverlayNewEl.classList.toggle('active', openAction); if (openAction && currentVisibleSourceId) { autoExpandAndScrollToCurrentQuestionChapter(); } }
</script>

</body>
</html>
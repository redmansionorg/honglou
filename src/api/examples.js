// JavaScript Example: Reading Entities
// Filterable fields: title, author, description, genre, cover_image, status, is_published, tags, total_chapters, reads_count, rating, content_updated_date, bc_contract_address, bc_author_address, bc_pseudonym, bc_synopsis_cid, bc_logo_cid, bc_registry_address
async function fetchNovelEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/Novel`, {
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: title, author, description, genre, cover_image, status, is_published, tags, total_chapters, reads_count, rating, content_updated_date, bc_contract_address, bc_author_address, bc_pseudonym, bc_synopsis_cid, bc_logo_cid, bc_registry_address
async function updateNovelEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/Novel/${entityId}`, {
        method: 'PUT',
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log(data);
}




// JavaScript Example: Reading Entities
// Filterable fields: novel_id, chapter_number, title, content, word_count, published, bc_novel_contract_address, bc_chapter_identifier, bc_content_cid
async function fetchChapterEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/Chapter`, {
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: novel_id, chapter_number, title, content, word_count, published, bc_novel_contract_address, bc_chapter_identifier, bc_content_cid
async function updateChapterEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/Chapter/${entityId}`, {
        method: 'PUT',
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log(data);
}




// JavaScript Example: Reading Entities
// Filterable fields: user_id, novel_id, current_chapter, progress_percentage, last_read_date, is_favorite, reading_status, last_read_paragraph_index
async function fetchReadingProgressEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/ReadingProgress`, {
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: user_id, novel_id, current_chapter, progress_percentage, last_read_date, is_favorite, reading_status, last_read_paragraph_index
async function updateReadingProgressEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/ReadingProgress/${entityId}`, {
        method: 'PUT',
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log(data);
}






// JavaScript Example: Reading Entities
// Filterable fields: target_type, target_id, paragraph_index, parent_comment_id, user_id, user_name, content, likes_count, replies_count
async function fetchCommentEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/Comment`, {
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: target_type, target_id, paragraph_index, parent_comment_id, user_id, user_name, content, likes_count, replies_count
async function updateCommentEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/Comment/${entityId}`, {
        method: 'PUT',
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log(data);
}






// JavaScript Example: Reading Entities
// Filterable fields: user_id, comment_id
async function fetchLikeEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/Like`, {
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: user_id, comment_id
async function updateLikeEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/Like/${entityId}`, {
        method: 'PUT',
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log(data);
}






// JavaScript Example: Reading Entities
// Filterable fields: user_id, novel_id, rating, review
async function fetchRatingEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/Rating`, {
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: user_id, novel_id, rating, review
async function updateRatingEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/Rating/${entityId}`, {
        method: 'PUT',
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log(data);
}







// JavaScript Example: Reading Entities
// Filterable fields: bc_address, pseudonym, email, bio, avatar_url, cover_url, external_url, bc_metadata_cid, bc_bio_cid, bc_avatar_cid, bc_cover_cid, create_time, update_time, is_celebrity, is_kyc, is_verified, is_active
async function fetchAuthorProfileEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/AuthorProfile`, {
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: bc_address, pseudonym, email, bio, avatar_url, cover_url, external_url, bc_metadata_cid, bc_bio_cid, bc_avatar_cid, bc_cover_cid, create_time, update_time, is_celebrity, is_kyc, is_verified, is_active
async function updateAuthorProfileEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/7169f04063974bbc9167ef7d829cee52/entities/AuthorProfile/${entityId}`, {
        method: 'PUT',
        headers: {
            'api_key': '7169f04063974bbc9167ef7d829cee52', // or use await User.me() to get the API key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log(data);
}






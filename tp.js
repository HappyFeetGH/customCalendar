const mysql = require('mysql2');
const https = require('https');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'psw',
    password: '1234',
    database: 'team_calendar'
});

const API_KEY = 'ZKhVYH0iHyyo6DURi7ckOYgwgahJ0u9KYXlnYNm7NMxBeynmTsjAnbrRXV9dUl9EWKCAUze98OmXgdr%2BI8cKVg%3D%3D';
const HOLIDAY_API_URI = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';

function fetchHolidays(year, callback) {
    const query = `${HOLIDAY_API_URI}?ServiceKey=${API_KEY}&solYear=${year}&numOfRows=100&_type=json`;

    https.get(query, (res) => {
        let data = '';

        // 데이터가 들어올 때마다 추가
        res.on('data', chunk => {
            data += chunk;
        });

        // 데이터 수신 완료 시 처리
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                const holidays = jsonData.response.body.items.item;
                callback(null, holidays);
            } catch (err) {
                callback(err, null);
            }
        });
    }).on('error', (err) => {
        callback(err, null);
    });
}

function insertHolidayEvents(year) {
    fetchHolidays(year, (err, holidays) => {
        if (err) {
            console.error('Error fetching holidays:', err);
            return;
        }

        
        const insertQuery = `
            INSERT INTO Events (title, description, start_datetime, end_datetime, created_by, tag_id)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description)
        `;

        holidays.forEach(holiday => {
            const date = holiday.locdate.toString(); // YYYYMMDD 형식
            const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
            const title = holiday.dateName;

            connection.query(
                insertQuery,
                [title, '공휴일', formattedDate, formattedDate, 1, 9], // 시스템 계정(0)과 공휴일 태그 사용
                (err) => {
                    if (err) {
                        console.error(`Error inserting holiday: ${title} (${formattedDate})`, err);
                    } else {
                        console.log(`Inserted/Updated holiday: ${title} (${formattedDate})`);
                    }
                }
            );
        });

        console.log('공휴일 데이터 삽입 완료');
    });
}

// 실행
insertHolidayEvents(2025);
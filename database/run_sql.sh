
echo "=== Bắt đầu tạo database Housekeeping Service ==="

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' 


if ! command -v mysql &> /dev/null; then
    echo -e "${RED}Lỗi: MySQL chưa được cài đặt hoặc không có trong PATH${NC}"
    exit 1
fi

read -p "MySQL username (mặc định: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -sp "MySQL password: " MYSQL_PASSWORD
echo ""

echo -e "\n${GREEN}[1/2] Đang tạo cấu trúc database...${NC}"
mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" < "$(dirname "$0")/schema.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tạo cấu trúc database thành công${NC}"
else
    echo -e "${RED}✗ Lỗi khi tạo cấu trúc database${NC}"
    exit 1
fi

echo -e "\n${GREEN}[2/2] Đang import dữ liệu mẫu...${NC}"
mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" < "$(dirname "$0")/sample_data.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Import dữ liệu thành công${NC}"
else
    echo -e "${RED}✗ Lỗi khi import dữ liệu${NC}"
    exit 1
fi

echo -e "\n${GREEN}=== Hoàn tất! Database đã được tạo và import dữ liệu ==="
echo -e "Database name: housekeeping_service${NC}"
echo -e "\nBạn có thể kiểm tra bằng lệnh:"
echo "  mysql -u$MYSQL_USER -p -e 'USE housekeeping_service; SELECT COUNT(*) as total_helpers FROM helpers;'"

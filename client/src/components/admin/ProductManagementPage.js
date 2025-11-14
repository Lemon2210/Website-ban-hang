import React, { useState } from "react";
// Import các component UI
import { Card } from "../../components/ui/card"; // Điều chỉnh đường dẫn tương đối nếu cần
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Search, Plus, Edit, Trash2 } from "lucide-react"; // Import từ icon library

export function ProductManagementPage() {
  // --- (Dữ liệu tĩnh từ Figma, chúng ta sẽ thay bằng API sau) ---
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Đầm Lụa Buổi Tối Cao Cấp",
      sku: "DAM-001",
      category: "Thời Trang Nữ",
      price: "1.990.000₫",
      stock: 45,
      status: "Còn hàng",
      image: "https://via.placeholder.com/60x60" // Ảnh mẫu
    },
    {
      id: 2,
      name: "Đồng Hồ Da Cổ Điển",
      sku: "DONGHO-001",
      category: "Phụ Kiện",
      price: "3.990.000₫",
      stock: 23,
      status: "Còn hàng",
      image: "https://via.placeholder.com/60x60"
    },
    {
      id: 3,
      name: "Túi Xách Thiết Kế",
      sku: "TUI-001",
      category: "Phụ Kiện",
      price: "4.490.000₫",
      stock: 12,
      status: "Còn hàng",
      image: "https://via.placeholder.com/60x60"
    },
    {
      id: 4,
      name: "Áo Blazer Cao Cấp",
      sku: "BLAZER-001",
      category: "Thời Trang Nam",
      price: "2.990.000₫",
      stock: 8,
      status: "Sắp hết",
      image: "https://via.placeholder.com/60x60"
    },
    {
      id: 5,
      name: "Giày Sneaker Thường Ngày",
      sku: "GIAY-001",
      category: "Giày Dép",
      price: "1.290.000₫",
      stock: 0,
      status: "Hết hàng",
      image: "https://via.placeholder.com/60x60"
    },
  ]);
  // --- Hết dữ liệu tĩnh ---

  // Hàm xử lý xóa sản phẩm (chỉ là giả lập)
  const handleDeleteProduct = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) {
      setProducts(products.filter(product => product.id !== id));
      alert("Sản phẩm đã được xóa (chỉ là giả lập)");
    }
  };

  return (
    <div className="space-y-6 p-4"> {/* Thêm padding để giao diện thoáng hơn */}
      {/* TIÊU ĐỀ VÀ NÚT THÊM SẢN PHẨM */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">
            Quản lý Sản phẩm
          </h2>
          <p className="text-gray-600">
            Quản lý danh mục sản phẩm của bạn
          </p>
        </div>
        <Button className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-md">
          <Plus size={20} />
          <span>Thêm Sản phẩm</span>
        </Button>
      </div>

      {/* THANH TÌM KIẾM VÀ FILTER */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..." 
            className="w-full pl-10 pr-4 py-2 border rounded-md" 
          />
        </div>
        <Button variant="outline" className="border px-4 py-2 rounded-md">
          Lọc
        </Button>
      </div>

      {/* BẢNG SẢN PHẨM */}
      <Card className="p-0"> {/* Loại bỏ padding mặc định của Card */}
        <div className="overflow-x-auto"> {/* Đảm bảo bảng cuộn nếu nội dung quá dài */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tồn kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img 
                          className="h-10 w-10 rounded-full" 
                          src={product.image} 
                          alt={product.name} 
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant={
                        product.status === "Còn hàng" ? "success" : 
                        product.status === "Sắp hết" ? "warning" : "danger"
                      }
                    >
                      {product.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-5 w-5 text-gray-500 hover:text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PHÂN TRANG (PAGINATION) */}
      <div className="flex items-center justify-between text-sm text-gray-600 px-4"> {/* Thêm padding cho phần này */}
        <span>Đang hiển thị 1 đến {products.length} của {products.length} sản phẩm</span>
        <div className="space-x-2">
          <Button variant="outline" disabled>Trước</Button>
          <Button variant="outline">Sau</Button>
        </div>
      </div>
    </div>
  );
}
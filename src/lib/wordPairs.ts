import type { WordPair } from '../types/game'

export const WORD_PAIRS: WordPair[] = [
  // สัตว์
  { civilian: 'แมว', undercover: 'สุนัข' },
  { civilian: 'แมว', undercover: 'เสือ' },
  { civilian: 'ช้าง', undercover: 'แรด' },
  { civilian: 'เสือ', undercover: 'สิงโต' },
  { civilian: 'ปลาวาฬ', undercover: 'โลมา' },
  { civilian: 'ไก่', undercover: 'เป็ด' },
  { civilian: 'กระต่าย', undercover: 'กระรอก' },
  { civilian: 'กระต่าย', undercover: 'หนูแฮมสเตอร์' },
  { civilian: 'หมา', undercover: 'หมาป่า' },
  { civilian: 'จระเข้', undercover: 'ตัวเหี้ย' },
  { civilian: 'นกแก้ว', undercover: 'นกขุนทอง' },
  { civilian: 'ปลาทอง', undercover: 'ปลากัด' },
  { civilian: 'ม้า', undercover: 'ม้าลาย' },
  { civilian: 'ผึ้ง', undercover: 'ต่อ' },
  { civilian: 'เต่า', undercover: 'ตะพาบ' },
  { civilian: 'กุ้ง', undercover: 'กั้ง' },
  { civilian: 'เป็ด', undercover: 'ห่าน' },

  // อาหารและเครื่องดื่ม
  { civilian: 'โค้ก', undercover: 'เป๊ปซี่' },
  { civilian: 'กาแฟ', undercover: 'ชา' },
  { civilian: 'ชาเย็น', undercover: 'กาแฟเย็น' },
  { civilian: 'พิซซ่า', undercover: 'พาย' },
  { civilian: 'ส้มตำ', undercover: 'ยำ' },
  { civilian: 'ส้มตำ', undercover: 'ยำมะม่วง' },
  { civilian: 'ข้าวผัด', undercover: 'ผัดไทย' },
  { civilian: 'ข้าวผัด', undercover: 'ข้าวคลุกกะปิ' },
  { civilian: 'ไอศกรีม', undercover: 'โยเกิร์ต' },
  { civilian: 'เบียร์', undercover: 'ไวน์' },
  { civilian: 'แอปเปิ้ล', undercover: 'ลูกแพร์' },
  { civilian: 'มะม่วง', undercover: 'มะละกอ' },
  { civilian: 'ก๋วยเตี๋ยว', undercover: 'บะหมี่' },
  { civilian: 'หมูกระทะ', undercover: 'ชาบู' },
  { civilian: 'ข้าวเหนียวมะม่วง', undercover: 'ข้าวเหนียวทุเรียน' },
  { civilian: 'ไข่ดาว', undercover: 'ไข่เจียว' },
  { civilian: 'ลูกชิ้นปิ้ง', undercover: 'ไส้กรอกปิ้ง' },
  { civilian: 'โจ๊ก', undercover: 'ข้าวต้ม' },
  { civilian: 'น้ำปลา', undercover: 'ซีอิ๊ว' },
  { civilian: 'กะเพรา', undercover: 'ผัดพริกแกง' },
  { civilian: 'ขนมครก', undercover: 'ขนมถ้วย' },
  { civilian: 'ปาท่องโก๋', undercover: 'โดนัท' },
  { civilian: 'เฟรนช์ฟรายส์', undercover: 'มันฝรั่งทอดแผ่น' },

  // กีฬา
  { civilian: 'ฟุตบอล', undercover: 'รักบี้' },
  { civilian: 'ฟุตบอล', undercover: 'ฟุตซอล' },
  { civilian: 'บาสเกตบอล', undercover: 'วอลเลย์บอล' },
  { civilian: 'เทนนิส', undercover: 'แบดมินตัน' },
  { civilian: 'ว่ายน้ำ', undercover: 'ดำน้ำ' },
  { civilian: 'มวยไทย', undercover: 'ยูโด' },
  { civilian: 'วิ่ง', undercover: 'เดินเร็ว' },
  { civilian: 'โยคะ', undercover: 'พิลาทิส' },

  // กิจกรรม & เกม
  { civilian: 'ตกปลา', undercover: 'ดำน้ำ' },
  { civilian: 'ปีนเขา', undercover: 'เดินป่า' },
  { civilian: 'ตั้งแคมป์', undercover: 'ปิกนิก' },
  { civilian: 'หมากรุก', undercover: 'หมากฮอส' },
  { civilian: 'ไพ่', undercover: 'โดมิโน' },

  // การเดินทาง
  { civilian: 'รถไฟ', undercover: 'รถไฟฟ้า' },
  { civilian: 'เครื่องบิน', undercover: 'เฮลิคอปเตอร์' },
  { civilian: 'เรือ', undercover: 'เรือดำน้ำ' },
  { civilian: 'รถยนต์', undercover: 'รถมอเตอร์ไซค์' },
  { civilian: 'BTS', undercover: 'MRT' },
  { civilian: 'แท็กซี่', undercover: 'วินมอเตอร์ไซค์' },
  { civilian: 'สนามบิน', undercover: 'สถานีรถไฟ' },

  // สถานที่
  { civilian: 'ทะเล', undercover: 'ทะเลสาบ' },
  { civilian: 'ทะเล', undercover: 'สระว่ายน้ำ' },
  { civilian: 'ภูเขา', undercover: 'เนินเขา' },
  { civilian: 'ภูเขา', undercover: 'น้ำตก' },
  { civilian: 'โรงแรม', undercover: 'รีสอร์ท' },
  { civilian: 'โรงพยาบาล', undercover: 'คลินิก' },
  { civilian: 'ห้างสรรพสินค้า', undercover: 'ตลาด' },
  { civilian: 'ห้างสรรพสินค้า', undercover: 'ตลาดนัด' },
  { civilian: 'เซเว่น', undercover: 'โลตัส' },
  { civilian: 'โรงหนัง', undercover: 'Netflix' },
  { civilian: 'วัด', undercover: 'โบสถ์' },
  { civilian: 'เชียงใหม่', undercover: 'เชียงราย' },

  // เทคโนโลยี
  { civilian: 'สมาร์ทโฟน', undercover: 'แท็บเล็ต' },
  { civilian: 'แล็ปท็อป', undercover: 'คอมพิวเตอร์ตั้งโต๊ะ' },
  { civilian: 'แล็ปท็อป', undercover: 'แท็บเล็ต' },
  { civilian: 'หูฟัง', undercover: 'ลำโพง' },
  { civilian: 'กล้องถ่ายรูป', undercover: 'กล้องวิดีโอ' },
  { civilian: 'iPhone', undercover: 'Samsung' },

  // ความบันเทิง
  { civilian: 'ภาพยนตร์', undercover: 'ซีรีส์' },
  { civilian: 'คอนเสิร์ต', undercover: 'เทศกาลดนตรี' },
  { civilian: 'คาราโอเกะ', undercover: 'คอนเสิร์ต' },
  { civilian: 'หนังสือ', undercover: 'หนังสือการ์ตูน' },
  { civilian: 'เกมคอมพิวเตอร์', undercover: 'เกมกระดาน' },

  // เสื้อผ้าและแฟชั่น
  { civilian: 'รองเท้าผ้าใบ', undercover: 'รองเท้าแตะ' },
  { civilian: 'เสื้อยืด', undercover: 'เสื้อโปโล' },
  { civilian: 'กางเกงยีนส์', undercover: 'กางเกงขาสั้น' },

  // ของใช้ทั่วไป
  { civilian: 'ร่ม', undercover: 'กันแดด' },
  { civilian: 'ร่ม', undercover: 'เสื้อกันฝน' },
  { civilian: 'นาฬิกา', undercover: 'นาฬิกาปลุก' },
  { civilian: 'นาฬิกาข้อมือ', undercover: 'สมาร์ทวอทช์' },
  { civilian: 'แว่นตา', undercover: 'แว่นกันแดด' },
  { civilian: 'แว่นตา', undercover: 'คอนแทคเลนส์' },
  { civilian: 'ดินสอ', undercover: 'ปากกา' },
  { civilian: 'พัดลม', undercover: 'แอร์' },
  { civilian: 'กระเป๋าเป้', undercover: 'กระเป๋าสะพายข้าง' },
  { civilian: 'ทิชชู่', undercover: 'ผ้าเช็ดหน้า' },
  { civilian: 'ไม้กวาด', undercover: 'เครื่องดูดฝุ่น' },
  { civilian: 'กุญแจ', undercover: 'คีย์การ์ด' },

  // อาชีพ & บุคคล
  { civilian: 'หมอ', undercover: 'พยาบาล' },
  { civilian: 'ครู', undercover: 'ติวเตอร์' },
  { civilian: 'ตำรวจ', undercover: 'ทหาร' },
  { civilian: 'นักร้อง', undercover: 'นักแสดง' },
  { civilian: 'เชฟ', undercover: 'แม่ครัว' },
  { civilian: 'ยูทูบเบอร์', undercover: 'สตรีมเมอร์' },
  { civilian: 'แอร์โฮสเตส', undercover: 'ไกด์ทัวร์' },
  { civilian: 'ช่างตัดผม', undercover: 'ช่างแต่งหน้า' },
  { civilian: 'นักบิน', undercover: 'กัปตันเรือ' },
  { civilian: 'ไรเดอร์ส่งอาหาร', undercover: 'บุรุษไปรษณีย์' },

  // ความสัมพันธ์ & ชีวิตประจำวัน
  { civilian: 'แฟน', undercover: 'เพื่อนสนิท' },
  { civilian: 'งานแต่งงาน', undercover: 'งานหมั้น' },
  { civilian: 'วันเกิด', undercover: 'วันครบรอบ' },
  { civilian: 'จีบ', undercover: 'ขอเป็นแฟน' },
  { civilian: 'อกหัก', undercover: 'โดนเท' },
  { civilian: 'นอนตื่นสาย', undercover: 'นอนกลางวัน' },
  { civilian: 'เงินเดือน', undercover: 'โบนัส' },
  { civilian: 'ลางาน', undercover: 'โดดงาน' },
  { civilian: 'ประชุม', undercover: 'สัมมนา' },
  { civilian: 'Work from home', undercover: 'ทำงานที่คาเฟ่' },

  // คำยาก (คำใกล้กันมาก)
  { civilian: 'น้ำแข็งใส', undercover: 'บิงซู' },
  { civilian: 'ชานมไข่มุก', undercover: 'ชานมบราวน์ชูการ์' },
  { civilian: 'ครีมกันแดด', undercover: 'โลชั่น' },
  { civilian: 'สบู่', undercover: 'ครีมอาบน้ำ' },
  { civilian: 'ผ้าห่ม', undercover: 'ผ้านวม' },
  { civilian: 'หมอน', undercover: 'หมอนข้าง' },
  { civilian: 'ลิฟต์', undercover: 'บันไดเลื่อน' },
  { civilian: 'แสตมป์', undercover: 'สติกเกอร์' },
  { civilian: 'น้ำหอม', undercover: 'สเปรย์ดับกลิ่น' },
  { civilian: 'กรรไกร', undercover: 'คัตเตอร์' },
  { civilian: 'เทียน', undercover: 'ตะเกียง' },
  { civilian: 'ฟองน้ำ', undercover: 'ฝอยขัด' },
]

export function getRandomWordPair(): WordPair {
  return WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)]
}

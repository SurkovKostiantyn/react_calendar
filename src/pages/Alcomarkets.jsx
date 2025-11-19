import InfoBlock from '../components/InfoBlock';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const markets = [
  {
    name: 'Alcomag',
    url: 'https://alcomag.ua/ua/sale/aktualnye_skidki/',
    logo: 'https://alcomag.ua/upload/CMax/c1e/vk8xuiotymgp30qt7w8yqdxcyr0klf3o.png',
  },
  {
    name: 'OKwine',
    url: 'https://okwine.ua/ua/action',
    logo: 'https://content.okwine.ua/public/images/logo/logo.jpg',
  },
  {
    name: 'WineWorld',
    url: 'https://shop.wineworld.com.ua/krepkie-napitki',
    logo: 'https://shop.wineworld.com.ua/image/catalog/Group.svg',
  },
  {
    name: 'HopHey',
    url: 'https://hophey.ua/ru/?srsltid=AfmBOoqlzywMrUV3MDyPA-33zZErWv03011J48NWpVl-mzhzGoVoqT5t',
    logo: 'https://hophey.ua/local/templates/hophey/images/logo.svg',
  },
];

const Alcomarkets = () => (
  <InfoBlock icon={<ShoppingCartIcon color="primary" sx={{ fontSize: 32 }} />} title="Алкомаркети" bgcolor="#e3f2fd">
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {markets.map(m => (
        <a key={m.name} href={m.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#fff', borderRadius: 2, boxShadow: 1, p: 2, gap: 2, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 } }}>
            <img src={m.logo} alt={m.name} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, background: '#f5f5f5' }} />
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>{m.name}</Typography>
          </Box>
        </a>
      ))}
    </Box>
  </InfoBlock>
);

export default Alcomarkets; 
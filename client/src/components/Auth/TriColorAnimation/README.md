# 🇮🇳 Tri-Color Animation Component

A beautiful, patriotic login animation featuring the Indian tri-color flag with stunning visual effects.

## ✨ Features

- **🏁 Tri-color Flag**: Animated Indian flag with saffron, white, and green stripes
- **⚙️ Ashoka Chakra**: Spinning wheel symbol in the center white strip
- **🎊 Welcome Message**: Personalized greeting with "जय हिन्द" message
- **✅ Success Animation**: Pulsing checkmark indicating successful login
- **✨ Floating Particles**: Tri-color particles floating around the animation
- **📱 Responsive**: Works perfectly on all screen sizes
- **🌙 Dark Mode**: Automatic dark mode support

## 🚀 Usage

```jsx
import TriColorAnimation from './TriColorAnimation/TriColorAnimation';

const MyComponent = () => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [userName, setUserName] = useState('');

  const handleLoginSuccess = () => {
    setUserName('John Doe');
    setShowAnimation(true);
  };

  const handleAnimationComplete = () => {
    // Navigate to dashboard or perform next action
    navigate('/dashboard');
  };

  return (
    <div>
      <TriColorAnimation 
        isVisible={showAnimation}
        onComplete={handleAnimationComplete}
        userName={userName}
      />
      
      {/* Your login form here */}
    </div>
  );
};
```

## 🎛️ Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isVisible` | boolean | Yes | - | Controls when the animation is shown |
| `onComplete` | function | Yes | - | Callback fired when animation completes |
| `userName` | string | No | "User" | Name to display in welcome message |

## 🎨 Animation Timeline

1. **0-500ms**: Fade in with tri-color background
2. **500-1000ms**: Tri-color strips animate in
3. **1000-1500ms**: Strips expand and Ashoka Chakra appears
4. **1500-2000ms**: Chakra starts spinning, content fades in
5. **2000-3500ms**: Welcome message and loading indicators
6. **3500-4000ms**: Animation completes and calls `onComplete`

## 🎭 Customization

The animation uses CSS custom properties for easy theming:

```css
.tricolor-overlay {
  /* Override background gradient */
  background: linear-gradient(135deg, 
    rgba(255, 153, 51, 0.95) 0%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(19, 136, 8, 0.95) 100%);
}
```

## 🔧 Development

To test the animation in isolation:

```jsx
import TriColorAnimationTest from './TriColorAnimationTest';

// Use this component to preview the animation
<TriColorAnimationTest />
```

## 📱 Responsive Breakpoints

- **Desktop**: Full size animation (600x400px)
- **Tablet**: Medium size (320x280px) 
- **Mobile**: Compact size (280x240px)

## 🎯 Performance

- Optimized animations using CSS transforms
- Hardware acceleration enabled
- Minimal re-renders with React.memo potential
- Smooth 60fps animations

---

**Built with ❤️ for VARUNA - Ocean Disaster Management System**
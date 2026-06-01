// ─────────────────────────────────────────────
// TreeHouseEntry — 树屋开场动画页
//
// 用户首次进入看到坡屋顶树屋，点击门后进入选宠物页面。
// 如果已完成 onboarding，则直接跳到 Dashboard。
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TreeHouseScene } from '../../components/TreeHouseScene';
import { usePetStore } from '../../store/petStore';

const TreeHouseEntry: React.FC = () => {
  const navigate = useNavigate();
  const isOnboarded = usePetStore((s) => s.isOnboarded);
  const [doorOpen, setDoorOpen] = useState(false);

  // 已完成 onboarding 的用户：短暂动画后直接进 Dashboard
  useEffect(() => {
    if (isOnboarded) {
      const t = setTimeout(() => navigate('/dashboard'), 1800);
      return () => clearTimeout(t);
    }
  }, [isOnboarded, navigate]);

  const handleDoorClick = () => {
    if (doorOpen) return;
    setDoorOpen(true);
    // 门打开动画完成后跳转
    setTimeout(() => {
      navigate(isOnboarded ? '/dashboard' : '/select-pet');
    }, 1400);
  };

  return (
    <div
      className="
        w-screen h-screen
        flex flex-col items-center justify-between
        overflow-hidden
        relative
      "
      style={{
        background: 'radial-gradient(ellipse at 50% 60%, #1a1a3e 0%, #0d0d1a 100%)',
      }}
    >
      {/* 顶部标题 */}
      <motion.div
        className="mt-12 text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <h1 className="text-3xl font-light text-white tracking-widest">
          Health Buddy
        </h1>
        <p className="text-white/50 text-sm mt-2 tracking-wider">
          你的健康小伙伴，住在这里
        </p>
      </motion.div>

      {/* 树屋主场景 */}
      <motion.div
        className="flex-1 w-full flex items-center justify-center pb-8"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
      >
        <TreeHouseScene doorOpen={doorOpen} onDoorClick={handleDoorClick} />
      </motion.div>

      {/* 底部说明 */}
      <motion.div
        className="mb-10 text-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        {!doorOpen && (
          <p className="text-white/30 text-xs">
            {isOnboarded ? '欢迎回来～' : '首次访问，选择你的小鸟伙伴'}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default TreeHouseEntry;

'use client';

import { motion } from 'framer-motion';
import { fadeInUp } from '../../../lib/motion';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center"
        >
          <p className="text-neutral-400 text-sm">
            © 2025 Theodore Rounds. All rights reserved.{' '}
            <Link
              href="/privacy"
              className="text-neutral-400 hover:text-white text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            {' '}
            <Link
              href="/terms"
              className="text-neutral-400 hover:text-white text-sm transition-colors"
            >
              Terms of Service
            </Link>
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
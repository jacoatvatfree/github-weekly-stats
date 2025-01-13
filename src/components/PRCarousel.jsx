import { useState } from 'react';

export default function PRCarousel({ pullRequests }) {
  const [currentPRIndex, setCurrentPRIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Filter PRs with images
  const prsWithImages = pullRequests.filter(pr => pr.images && pr.images.length > 0);

  if (prsWithImages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">Pull Request Images</h3>
        <p className="text-gray-500">No images found in pull requests</p>
      </div>
    );
  }

  const currentPR = prsWithImages[currentPRIndex];
  const currentImage = currentPR.images[currentImageIndex];

  const nextImage = () => {
    if (currentImageIndex < currentPR.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else if (currentPRIndex < prsWithImages.length - 1) {
      setCurrentPRIndex(currentPRIndex + 1);
      setCurrentImageIndex(0);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (currentPRIndex > 0) {
      setCurrentPRIndex(currentPRIndex - 1);
      setCurrentImageIndex(prsWithImages[currentPRIndex - 1].images.length - 1);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
      <h3 className="text-lg font-semibold mb-4">Pull Request Images</h3>
      <div className="relative">
        <div className="aspect-video relative overflow-hidden rounded-lg">
          <img
            src={currentImage}
            alt={`Image from PR #${currentPR.number}`}
            className="w-full h-full object-contain"
          />
        </div>
        
        <div className="absolute inset-0 flex items-center justify-between">
          <button
            onClick={previousImage}
            disabled={currentPRIndex === 0 && currentImageIndex === 0}
            className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <button
            onClick={nextImage}
            disabled={
              currentPRIndex === prsWithImages.length - 1 &&
              currentImageIndex === currentPR.images.length - 1
            }
            className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="font-medium">
          PR #{currentPR.number}: {currentPR.title}
        </h4>
        <p className="text-sm text-gray-500">
          Image {currentImageIndex + 1} of {currentPR.images.length}
        </p>
      </div>
    </div>
  );
}

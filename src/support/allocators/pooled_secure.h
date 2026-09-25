// Copyright (c) 2014-2018 The Dash Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#ifndef SYSCOIN_SUPPORT_ALLOCATORS_POOLED_SECURE_H
#define SYSCOIN_SUPPORT_ALLOCATORS_POOLED_SECURE_H

#include <support/lockedpool.h>
#include <support/cleanse.h>

#include <stdexcept>
#include <string>
#include <vector>

//
// Allocator that allocates from the process-wide locked (secure) memory pool.
// Memory is cleansed when freed. This allocator is NOT thread safe (see
// mt_pooled_secure_allocator for the thread-safe wrapper).
//
// Note: this was historically implemented on top of boost::pool, which was
// removed from Boost in 1.89. The LockedPoolManager already chunks, pools and
// reuses locked pages internally, so allocating from it directly preserves
// the original semantics (secure pages + cleansing on free) without the
// extra layer.
//
template <typename T>
struct pooled_secure_allocator : public std::allocator<T> {
    // MSVC8 default copy constructor is broken
    typedef std::allocator<T> base;
    typedef typename base::size_type size_type;
    typedef typename base::difference_type difference_type;
#if !defined __cplusplus || __cplusplus < 202002L
    typedef typename base::pointer pointer;
    typedef typename base::const_pointer const_pointer;
    typedef typename base::reference reference;
    typedef typename base::const_reference const_reference;
#endif
    typedef typename base::value_type value_type;

    // Chunk-size parameters are accepted for API compatibility but are no
    // longer used: the locked pool manager handles chunking internally.
    pooled_secure_allocator(const size_type nrequested_size = 32,
                            const size_type nnext_size = 32,
                            const size_type nmax_size = 0) noexcept {}
    ~pooled_secure_allocator() noexcept {}

    T* allocate(std::size_t n, const void* hint = nullptr)
    {
        const size_t bytes = n * sizeof(T);
        void* p = LockedPoolManager::Instance().alloc(bytes ? bytes : 1);
        if (!p) {
            throw std::bad_alloc();
        }
        return static_cast<T*>(p);
    }

    void deallocate(T* p, std::size_t n)
    {
        if (!p) {
            return;
        }
        memory_cleanse(p, n * sizeof(T));
        LockedPoolManager::Instance().free(p);
    }
};

#endif // SYSCOIN_SUPPORT_ALLOCATORS_POOLED_SECURE_H
